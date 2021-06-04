import { ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import { Emoji } from "./Emoji";
import EmojiService from 'services/emojis/emojis';
import { getInsertRange } from "../../EditorUtils";
import EmojiSuggestion from "./EmojiSuggestion";
import { EditorSuggestionPlugin } from "../../EditorPlugins";

export type EmojiSuggestionType = {
  name: string;
  colons: string;
  native: any;
};

export const EmojiResourceType = "EMOJI";


const findEmojiEntities = (contentBlock: ContentBlock, callback: any, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: any) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === EmojiResourceType
      );
    },
    callback
  );
}

const resolver = (text: string, max: number, callback: (emojis: EmojiSuggestionType[]) => void) => {
  EmojiService.search(text, (suggestions: EmojiSuggestionType[]) => {
    const result: Array<EmojiSuggestionType & { autocomplete_id: number }> = [];

    for (let j = 0; j < max; j++) {
      result[j] = {...suggestions[j], ...{ autocomplete_id: j }};
    }
    callback(result);
  });
}

const addEmoji = (emoji: EmojiSuggestionType, editorState: EditorState): EditorState => {
  const { start, end } = getInsertRange(editorState, ":")
  const contentState = editorState.getCurrentContent()
  const currentSelection = editorState.getSelection()
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  })
  
  const contentStateWithEntity = contentState.createEntity( EmojiResourceType, 'IMMUTABLE', emoji);
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

const insertEmoji = (emoji: EmojiSuggestionType, editorState: EditorState): EditorState => {
  const contentState = editorState.getCurrentContent()
  const selection = editorState.getSelection()
  
  const entity = contentState.createEntity( EmojiResourceType, 'IMMUTABLE', emoji)
  const entityKey = entity.getLastCreatedEntityKey();
  
  const newContentState = Modifier.insertText(
    entity,
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


export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<EmojiSuggestionType> => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findEmojiEntities,
    component: Emoji,
  },
  trigger: /\B:([\-+\w]+)$/,
  resourceType: EmojiResourceType,
  onSelected: (emoji: EmojiSuggestionType, editorState: EditorState) => addEmoji(emoji, editorState),
  insert: (emoji: EmojiSuggestionType, editorState: EditorState) => insertEmoji(emoji, editorState),
  renderSuggestion: (emoji: EmojiSuggestionType) => EmojiSuggestion(emoji),
});
