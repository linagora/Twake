import { CharacterMetadata, ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import { getSelectedBlock } from "draftjs-utils";
import WorkspacesUser from 'services/workspaces/workspaces_users';
import { Mention } from "./Mention";
import MentionSuggestion from "./MentionSuggestion";
import { EditorSuggestionPlugin, SelectOrInsertOptions } from "../";
import AccessRightsService from "app/services/AccessRightsService";
import WorkspaceService from 'services/workspaces/workspaces';
import Collections from 'services/CollectionsReact/Collections';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';
import { getChannelMembers } from 'app/services/channels/ChannelCollectionPath';
import { UserType } from 'app/models/User';
import { ChannelMemberResource } from "app/models/Channel";
import UserService from 'services/user/UserService';
import RouterService from "app/services/RouterService";


import "./style.scss";

export const MENTION_TYPE = "MENTION";
const MENTION_CHAR = "@";

export type MentionSuggestionType = {
  username: string;
};

const findMentionEntities = (contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: CharacterMetadata) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === MENTION_TYPE
      );
    }, callback);
};

const resolver = (text: string, max: number, callback: (mentions: MentionSuggestionType[]) => void) => {
  const result: Array<MentionSuggestionType & { autocomplete_id: number }> = [];

  if (AccessRightsService.getCompanyLevel(WorkspaceService.currentGroupId) === 'guest') {
    // user is guest, lookup for channel members only
    const { companyId, workspaceId, channelId } = RouterService.getStateFromRoute();
    const channelMembersCollection = Collections.get(getChannelMembers(companyId, workspaceId, channelId), ChannelMemberResource);
    const users = channelMembersCollection.find({})
      .map(member => DepreciatedCollections.get('users').find(member.id))
      .filter((user: UserType) => `${user.username} ${user.firstname} ${user.lastname} ${user.email}`.toLocaleLowerCase().indexOf(text.toLocaleLowerCase()) >= 0);

    for (let j = 0; j < Math.min(max, users.length); j++) {
      result[j] = {...users[j], ...{ autocomplete_id: j }};
    }

    callback(result);
  } else {
    WorkspacesUser.searchUserInWorkspace(text, (users: Array<any>) => {
      for (let j = 0; j < Math.min(max, users.length); j++) {
        result[j] = {...users[j], ...{ autocomplete_id: j }};
      }
      callback(result);
    });
  }
};

const addMention = (mention: MentionSuggestionType, editorState: EditorState, options: SelectOrInsertOptions): EditorState => {
  let spaceAlreadyPresent = false;
  const username = UserService.getFullName(mention);
  const mentionText = `${MENTION_CHAR}${username}`;
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
    mentionText,
    newEditorState.getCurrentInlineStyle(),
    entityKey,
  );

  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters');

  if (!spaceAlreadyPresent && options.addSpaceAfter) {
    // insert a blank space after mention
    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: mentionIndex + mentionText.length,
      focusOffset: mentionIndex + mentionText.length,
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
};

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<MentionSuggestionType>  => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findMentionEntities,
    component: Mention,
  },
  trigger: /\B@([\-+\w]+)$/,
  resourceType: MENTION_TYPE,
  getTextDisplay: (mention: MentionSuggestionType) => mention.username,
  onSelected: (mention: MentionSuggestionType, editorState: EditorState, options: SelectOrInsertOptions = { addSpaceAfter: true }) => addMention(mention, editorState, options),
  renderSuggestion: (mention: MentionSuggestionType) => MentionSuggestion(mention),
  serializer: {
    replace: content => content.replace(/<MENTION\|(.*?)>(.*?)<\/MENTION>/gm, (_match, mention) => mention),
    open: entity => `<${MENTION_TYPE}|@${(entity as any).data.username}>`,
    close: () => `</${MENTION_TYPE}>`,
  },
  returnFullTextForSuggestion: true,
  // will skip suggestion when already in a MENTION block
  skipSuggestionForTypes: [MENTION_TYPE],
});