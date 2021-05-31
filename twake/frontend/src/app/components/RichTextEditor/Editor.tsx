import React, { KeyboardEvent } from "react";
import { Editor, EditorState, Modifier, CompositeDecorator, RichUtils, DraftEditorCommand, DraftHandleValue, DraftDecorator, KeyBindingUtil } from "draft-js";
import { toString } from "./EditorDataParser";
import useMentions, { MentionSuggestionType } from "./components/mentions/index";
import useEmojis, { EmojiSuggestionType } from "./components/emoji";
import { SuggestionList } from "./components/suggestion/SuggestionList";
import EmojiSuggestion from "./components/emoji/EmojiSuggestion";
import MentionSuggestion from "./components/mentions/MentionSuggestion";
import "./Editor.scss";

const { isSoftNewlineEvent } = KeyBindingUtil;

// inspired from https://codepen.io/ndne/pen/XEbMyP

export type EditorTextFormat = "raw" | "markdown";

type SyntheticKeyboardEvent = KeyboardEvent<{}> & {code: string};

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

type EditorProps = {
  editorState: EditorState;
  onSubmit?: (content: string, editorState?: EditorState) => void;
  onChange?: (editorState: EditorState) => void;
  clearOnSubmit: boolean;
  outputFormat: EditorTextFormat;
};

export type EditorSuggestionPlugin<SuggestionType> = {
  resolver: (text: string, callback: (items: SuggestionType[]) => void) => void;
  decorator: DraftDecorator;
  trigger: string | RegExp;
};

type EditorViewState = {
  activeMentionSuggestion: CurrentSuggestion<MentionSuggestionType> | null;
  activeEmojiSuggestion: CurrentSuggestion<EmojiSuggestionType> | null;
};

export class EditorView extends React.Component<EditorProps, EditorViewState> {
  outputFormat: EditorTextFormat;
  editor!: Editor | null;
  emojis: EditorSuggestionPlugin<EmojiSuggestionType>;
  mentions: EditorSuggestionPlugin<MentionSuggestionType>;

  constructor(props: EditorProps) {
    super(props);

    this.emojis = useEmojis();
    this.mentions = useMentions();
    this.outputFormat = this.props.outputFormat || "markdown";
    this.state = this.getInitialState();
  }

  private getInitialState(): EditorViewState {
    return {
      activeMentionSuggestion: null,
      activeEmojiSuggestion: null,
    }
  }

  private shouldDisplaySuggestions(): boolean {
    return !!(this.state.activeEmojiSuggestion?.items.length || this.state.activeMentionSuggestion?.items.length);
  }

  handleKeyCommand(command: DraftEditorCommand, editorState: EditorState): DraftHandleValue {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      this.onChange(newState);
      return 'handled';
    }

    return 'not-handled';
  }

  handleReturn(e: SyntheticKeyboardEvent, editorState: EditorState): DraftHandleValue {
    if (this._handleReturnSoftNewline(e, editorState)) {
      return 'handled';
    }
    
    // TODO: Handle when suggestion is displayed. Pressing 'Enter' should not submit but select the choice 

    if (this.submit(editorState)) {
      return 'handled';
    }
    
    return 'handled';
  }
  
  submit(editorState: EditorState): boolean {
    this.props.onSubmit && this.props.onSubmit(toString(editorState, this.outputFormat));
    if (this.props.clearOnSubmit) {
      this.setState(this.getInitialState(), () => {
        requestAnimationFrame(() => this.focus());
      });
    }

    return true;
  }

  /**
   * Handle shift + enter
   * 
   * @param e 
   * @param editorState 
   * @returns 
   */
  _handleReturnSoftNewline(e: SyntheticKeyboardEvent, editorState: EditorState): boolean {
    if (isSoftNewlineEvent(e)) {
      const selection = editorState.getSelection();

      if (selection.isCollapsed()) {
        this.onChange(RichUtils.insertSoftNewline(editorState));
      } else {
        let content = editorState.getCurrentContent();
        let newContent = Modifier.removeRange(content, selection, 'forward');
        let newSelection = newContent.getSelectionAfter();
        let block = newContent.getBlockForKey(newSelection.getStartKey());
        newContent = Modifier.insertText(
          newContent,
          newSelection,
          '\n',
          block.getInlineStyleAt(newSelection.getStartOffset()),
        );
        this.onChange(
          EditorState.push(editorState, newContent, 'insert-fragment')
        );
      }
      return true;
    }
    return false;
  }
  
  focus() {
    console.log("FOCUS EDITOR");
    this.editor?.focus();
  }
  
  onChange(editorState: EditorState) {
    this.updateSuggestionsState();
    this.props.onChange && this.props.onChange(editorState);
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
    const { activeMentionSuggestion } = this.state; 
    this.onChange(addMention(this.props.editorState, activeMentionSuggestion, user, "@"));
    this.setState({ activeMentionSuggestion: null }, () => {
      requestAnimationFrame(() => this.focus());
    });
  }
  
  handleEmojiSuggestionSelected(emoji: EmojiSuggestionType) {
    const { activeEmojiSuggestion } = this.state; 
    this.onChange(addEmoji(this.props.editorState, activeEmojiSuggestion, emoji));
    this.setState({ activeEmojiSuggestion: null }, () => {
      requestAnimationFrame(() => this.focus());
    });
  }

  render() {
    return <div 
      className="editor" 
      onClick={ this.focus.bind(this) }>
      
      <Editor
        ref={ node => this.editor = node }
        editorState={ this.props.editorState } 
        onChange={this.onChange.bind(this)}
        handleKeyCommand={this.handleKeyCommand.bind(this)}
        handleReturn={this.handleReturn.bind(this)}
        placeholder="Type a message, @mention someone"
        />
        
        {(
          this.shouldDisplaySuggestions() &&  
            <div style={{ position: "relative", top: "-40px" }} className="suggestions">
              {(
                this.state.activeMentionSuggestion?.items.length &&
                <div className="mentions">
                  <SuggestionList<MentionSuggestionType>
                    list={this.state.activeMentionSuggestion?.items}
                    position={"top"}
                    renderItem={(props: MentionSuggestionType) => (<MentionSuggestion {...props} />)}
                    onSelected={this.handleMentionSuggestionSelected.bind(this)}
                  />
                </div>
              )}

              {(
                this.state.activeEmojiSuggestion?.items.length &&
                <div className="emojis">
                  <SuggestionList<EmojiSuggestionType>
                  list={this.state.activeEmojiSuggestion?.items}
                  position={"top"}
                  renderItem={(props: EmojiSuggestionType) => (<EmojiSuggestion {...props} />)}
                  onSelected={this.handleEmojiSuggestionSelected.bind(this)}
                  />
                </div>
              )}
          </div>
        )}
    </div>
  }
}

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