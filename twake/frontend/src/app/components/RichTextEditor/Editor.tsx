import React from "react";
import { Editor, EditorState, Modifier, CompositeDecorator, RichUtils, DraftEditorCommand, DraftHandleValue, DraftDecorator, convertToRaw } from "draft-js";
import useMentions, { MentionSuggestionType } from "./components/mentions/index";
import useEmojis, { EmojiSuggestionType } from "./components/emoji";
import { SuggestionList } from "./components/suggestion/SuggestionList";
import EmojiSuggestion from "./components/emoji/EmojiSuggestion";
import MentionSuggestion from "./components/mentions/MentionSuggestion";

// inspired from https://codepen.io/ndne/pen/XEbMyP

type CaretCoordinates = {
  x: number;
  y: number;
}

type CurrentSuggestion<T> = {
  position: CaretCoordinates;
  searchText: string;
  selectedIndex: number;
  items: Array<T>;
};

function getSelectionRange() {
  const selection = window.getSelection()
  if (selection?.rangeCount === 0)
    return null
  return selection?.getRangeAt(0)
}

function getTrigger(trigger: string | RegExp) {
  if (typeof trigger === "string") {
    return getTriggerRange(trigger);
  } else if (trigger instanceof RegExp) {
    return getTriggerMatchRange(trigger);
  }
}

function getTriggerMatchRange(regexp: RegExp) {
  const range = getSelectionRange();
  if (!range) {
    return null;
  }
  const text  = range && range?.startContainer?.textContent?.substring(0, range.startOffset)
  if (!text || /\s+$/.test(text)) {
    return null;
  }

  const start = text.match(regexp);

  if (!start) {
    return;
  }

  const end = range.startOffset
  return {
    end,
    start,
    text: start[1],
  }
}

function getTriggerRange(term: string) {
  const range = getSelectionRange();
  if (!range) {
    return null;
  }
  const text  = range && range?.startContainer?.textContent?.substring(0, range.startOffset)
  if (!text || /\s+$/.test(text))
    return null

  const start = text.lastIndexOf(term)
  if (start === -1) {
    return null
  }

  const end = range.startOffset
  return {
    end,
    start,
    text:  text.substring(start),
  }
}

function getInsertRange(activeSuggestion: any, editorState: EditorState, trigger: string): { start: number, end: number } {
  const selection = editorState.getSelection()
  const content = editorState.getCurrentContent()
  const anchorKey = selection.getAnchorKey()
  const end = selection.getAnchorOffset()
  const block = content.getBlockForKey(anchorKey)
  const text = block.getText()
  const start = text.substring(0, end).lastIndexOf(trigger)

  return {
    start,
    end,
  };
}

const currentCoordinates: CaretCoordinates = {
  x: 0,
  y: 0,
};

function getCaretCoordinates(): CaretCoordinates {
  const range = getSelectionRange();
  if (range) {
    const { left: x, top: y }  = range.getBoundingClientRect();
    Object.assign(currentCoordinates, { x, y });
  }
  return currentCoordinates;
}


// TODO: Extract API

const addMention = (editorState: EditorState, activeSuggestion: any, mention: MentionSuggestionType, prefix: string) => {
  const { start, end } = getInsertRange(activeSuggestion, editorState, prefix)
  const contentState = editorState.getCurrentContent()
  const currentSelection = editorState.getSelection()
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  })
  
  // TODO: content can be anything so add the user id etc...
  const mentionEntity = contentState.createEntity('MENTION', 'IMMUTABLE', mention);
  const entityKey = mentionEntity.getLastCreatedEntityKey();

  // TODO: Can we avoid inserting the text and just relying on the decorator and Mention component?
  const newContentState = Modifier.replaceText(
    mentionEntity,
    selection,
    `${prefix}${mention.username}`,
    undefined,
    entityKey);

  const newEditorState = EditorState.push(
    // TODO: What is the difference with "insert-characters" which also works.
    editorState, newContentState, "insert-fragment"
  );

  return EditorState.forceSelection(
    newEditorState,
    newContentState.getSelectionAfter());

//  const newEditorState = EditorState.push(
//    editorState,
//    newContentState,
//    "insert-characters");
////    INSERT_ACTION_LABEL)
//  
//  return EditorState.forceSelection(
//    newEditorState,
//    newContentState.getSelectionAfter());
}

const addEmoji = (editorState: EditorState, activeSuggestion: any, emoji: EmojiSuggestionType) => {
  const { start, end } = getInsertRange(activeSuggestion, editorState, ":")
  const contentState = editorState.getCurrentContent()
  const currentSelection = editorState.getSelection()
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  })
  
  const contentStateWithEntity = contentState.createEntity(
    'EMOJI', 'IMMUTABLE', emoji)
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  
  const newContentState = Modifier.replaceText(
    contentStateWithEntity,
    selection,
    emoji.native,
    undefined,
    entityKey)
  
  const newEditorState = EditorState.push(
    editorState,
    newContentState,
    "insert-characters");
  
  return EditorState.forceSelection(
    newEditorState,
    newContentState.getSelectionAfter());
}

type EditorProps = {
  // TODO
};

export type EditorSuggestionPlugin<SuggestionType> = {
  resolver: (text: string, callback: (items: SuggestionType[]) => void) => void;
  decorator: DraftDecorator;
  trigger: string | RegExp;
};

type EditorViewState = {
  editorState: EditorState;
  activeMentionSuggestion: CurrentSuggestion<MentionSuggestionType> | null;
  activeEmojiSuggestion: CurrentSuggestion<EmojiSuggestionType> | null;
};

export class EditorView extends React.Component<EditorProps, EditorViewState> {
  editor!: Editor | null;
  emojis: EditorSuggestionPlugin<EmojiSuggestionType>;
  mentions: EditorSuggestionPlugin<MentionSuggestionType>;

  constructor(props: EditorProps) {
    super(props);

    this.emojis = useEmojis();
    this.mentions = useMentions();

    // TODO: Create decorators from configuration
    const decorators = new CompositeDecorator([this.emojis.decorator, this.mentions.decorator]);
    
    // TODO: Populate state from configuration and activated decorators
    this.state = {
      editorState: EditorState.createEmpty(decorators),
      activeMentionSuggestion: null,
      activeEmojiSuggestion: null,
    }
  }

  handleKeyCommand(command: DraftEditorCommand, editorState: EditorState): DraftHandleValue {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }
  
  focus () {
    this.editor?.focus();
  }
  
  onChange(editorState: EditorState) {
    console.log('raw state:', JSON.stringify(convertToRaw(editorState.getCurrentContent())));
    this.setState({ editorState }, this.updateSuggestionsState.bind(this));
  }
  
  updateSuggestionsState(): void {
    const triggerMention = getTrigger(this.mentions.trigger);

    if (!triggerMention) {
      this.setState({ activeMentionSuggestion: null });
    } else {
      this.mentions.resolver(triggerMention.text.slice(1, triggerMention.text.length), (mentions) => {
        const activeMentionSuggestion = {
          position: getCaretCoordinates(),
          searchText: triggerMention.text,
          selectedIndex: 0,
          items: mentions,
        };
        this.setState({ activeMentionSuggestion });
      });
      return;
    }
    
    const triggerEmoji = getTrigger(this.emojis.trigger);
    if (!triggerEmoji) {
      this.setState({ activeEmojiSuggestion: null });
    } else {
      this.emojis.resolver(triggerEmoji.text, (emojis) => {
        const activeEmojiSuggestion = {
          position: getCaretCoordinates(),
          searchText: triggerEmoji.text,
          selectedIndex: 0,
          items: emojis,
        };
        this.setState({ activeEmojiSuggestion });
      });
      return;
    }
  }
  
  handleMentionSuggestionSelected(user: MentionSuggestionType) {
    const { editorState, activeMentionSuggestion } = this.state; 
    this.onChange(addMention(editorState, activeMentionSuggestion, user, "@"));
    this.setState({ activeMentionSuggestion: null }, () => {
      requestAnimationFrame(() => this.focus());
    })
  }

  handleEmojiSuggestionSelected(emoji: EmojiSuggestionType) {
    const { editorState, activeEmojiSuggestion } = this.state; 
    this.onChange(addEmoji(editorState, activeEmojiSuggestion, emoji));
    this.setState({ activeEmojiSuggestion: null }, () => {
      requestAnimationFrame(() => this.focus());
    })
  }

  render() {
    return <div 
      className="editor" 
      onClick={ this.focus.bind(this) }>
      
      <Editor
        ref={ node => this.editor = node }
        editorState={ this.state.editorState } 
        onChange={this.onChange.bind(this)}
        handleKeyCommand={this.handleKeyCommand.bind(this)}
        placeholder="Type a message, @mention someone, #tag, /actionable"
        />
      
      <div style={{ position: "relative", top: "-40px" }}>  
        {(
          this.state.activeMentionSuggestion?.items.length && <SuggestionList<MentionSuggestionType>
          list={this.state.activeMentionSuggestion?.items}
          position={"top"}
          renderItem={(props: MentionSuggestionType) => (<MentionSuggestion {...props} />)}
          onSelected={this.handleMentionSuggestionSelected.bind(this)}
          />
        )}

        {(
          this.state.activeEmojiSuggestion?.items.length && <SuggestionList<EmojiSuggestionType>
          list={this.state.activeEmojiSuggestion?.items}
          position={"top"}
          renderItem={(props: EmojiSuggestionType) => (<EmojiSuggestion {...props} />)}
          onSelected={this.handleEmojiSuggestionSelected.bind(this)}
          />
        )}
      </div>
    </div>
  }

}
