import { CharacterMetadata, ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import WorkspacesUser from 'services/workspaces/workspaces_users';
import { Mention } from "./Mention";
import { getInsertRange } from "../../EditorUtils";
import MentionSuggestion from "./MentionSuggestion";
import { EditorSuggestionPlugin } from "../../EditorPlugins";
import "./style.scss";

export const MENTION_TYPE = "MENTION";

export type MentionSuggestionType = {
  username: string;
};

const findSuggestionEntities = (contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: CharacterMetadata) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === MENTION_TYPE
      );
    }, callback);
}

const resolver = (text: string, max: number, callback: (mentions: MentionSuggestionType[]) => void) => {
  WorkspacesUser.searchUserInWorkspace(text, (users: Array<any>) => {
    const result: Array<MentionSuggestionType & { autocomplete_id: number }> = [];

    for (let j = 0; j < Math.min(max, users.length); j++) {
      result[j] = {...users[j], ...{ autocomplete_id: j }};
    }
    callback(result);
  });
}

const addMention = (mention: MentionSuggestionType, editorState: EditorState): EditorState => {
  const { start, end } = getInsertRange(editorState, "@");
  const contentState = editorState.getCurrentContent();
  const currentSelection = editorState.getSelection();
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  });
  
  const mentionEntity = contentState.createEntity(MENTION_TYPE, 'IMMUTABLE', mention);
  const entityKey = mentionEntity.getLastCreatedEntityKey();

  // TODO: Can we avoid inserting the text and just relying on the decorator and Mention component?
  const newContentState = Modifier.replaceText(
    mentionEntity,
    selection,
    `@${mention.username}`,
    undefined,
    entityKey);

  const newEditorState = EditorState.push(
    editorState, newContentState, "insert-fragment"
  );

  return EditorState.forceSelection( newEditorState, newContentState.getSelectionAfter());
}

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<MentionSuggestionType>  => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findSuggestionEntities,
    component: Mention,
  },
  trigger: /\B@([\-+\w]+)$/,
  resourceType: MENTION_TYPE,
  getTextDisplay: (mention: MentionSuggestionType) => mention.username,
  onSelected: (mention: MentionSuggestionType, editorState: EditorState) => addMention(mention, editorState),
  renderSuggestion: (mention: MentionSuggestionType) => MentionSuggestion(mention),
});