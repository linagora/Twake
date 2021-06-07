import { CharacterMetadata, ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import { getSelectedBlock } from "draftjs-utils";
import WorkspacesUser from 'services/workspaces/workspaces_users';
import { Mention } from "./Mention";
import MentionSuggestion from "./MentionSuggestion";
import { EditorSuggestionPlugin } from "../../EditorPlugins";
import "./style.scss";

export const MENTION_TYPE = "MENTION";
const MENTION_CHAR = "@";

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
  let spaceAlreadyPresent = false;
  const mentionText = mention.username;
  const entityKey = editorState.getCurrentContent().createEntity(MENTION_TYPE, 'IMMUTABLE', mention).getLastCreatedEntityKey();
  const selectedBlock = getSelectedBlock(editorState);
  const selectedBlockText = selectedBlock.getText();
  let focusOffset = editorState.getSelection().getFocusOffset();
  const mentionIndex = (selectedBlockText.lastIndexOf(` ${MENTION_CHAR}`, focusOffset) || 0) + 1;

  if (selectedBlockText.length === mentionIndex + 1) {
    focusOffset = selectedBlockText.length;
  }

  if (selectedBlockText[focusOffset] === ' ') {
    spaceAlreadyPresent = true;
  }

  let updatedSelection = editorState.getSelection().merge({
    anchorOffset: mentionIndex,
    focusOffset,
  });
  let newEditorState = EditorState.acceptSelection(editorState, updatedSelection);
  let contentState = Modifier.replaceText(
    newEditorState.getCurrentContent(),
    updatedSelection,
    `${MENTION_CHAR}${mentionText}`,
    newEditorState.getCurrentInlineStyle(),
    entityKey,
  );

  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters');

  if (!spaceAlreadyPresent) {
    // insert a blank space after mention
    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: mentionIndex + mentionText.length + MENTION_CHAR.length,
      focusOffset: mentionIndex + mentionText.length + MENTION_CHAR.length,
    });
    newEditorState = EditorState.acceptSelection(newEditorState, updatedSelection);
    contentState = Modifier.insertText(
      newEditorState.getCurrentContent(),
      updatedSelection,
      ' ',
      newEditorState.getCurrentInlineStyle(),
      undefined,
    );
  }

  return EditorState.push(newEditorState, contentState, 'insert-characters');
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