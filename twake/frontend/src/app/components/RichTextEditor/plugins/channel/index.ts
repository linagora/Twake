import { ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import { getSelectedBlock } from "draftjs-utils";
import { Channel } from "./Channel";
import ChannelsService from 'services/channels/channels';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import ChannelSuggestion from "./ChannelSuggestion";
import { EditorSuggestionPlugin, SelectOrInsertOptions } from "../";

export type ChannelSuggestionType = ChannelType & { autocomplete_id: number };

export const ChannelResourceType = "CHANNEL";
const CHANNEL_CHAR = "#";

const findChannelEntities = (contentBlock: ContentBlock, callback: any, contentState: ContentState) => {
  contentBlock.findEntityRanges(
    (character: any) => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === ChannelResourceType
      );
    },
    callback
  );
}

const resolver = (text: string, max: number, callback: (channels: ChannelSuggestionType[]) => void) => {
  ChannelsService.search(text, (channels: ChannelResource[]) => {
    if (!channels || !channels.length) {
      callback([]);
      return;
    }

    return callback(channels.map((channel, index) => ({ ...channel.data, ...{ autocomplete_id: index }})));
  });
}

const addChannel = (channel: ChannelSuggestionType, editorState: EditorState, options: SelectOrInsertOptions): EditorState => {
  let spaceAlreadyPresent = false;
  const channelAsString = `${CHANNEL_CHAR}${(channel.name || "").toLocaleLowerCase().replace(/[^a-z0-9_\-.\u00C0-\u017F]/g, '')}`;
  const entityKey = editorState.getCurrentContent().createEntity(ChannelResourceType, 'IMMUTABLE', channel).getLastCreatedEntityKey();
  const selectedBlock = getSelectedBlock(editorState);
  const selectedBlockText = selectedBlock.getText();
  let focusOffset = editorState.getSelection().getFocusOffset();
  const channelIndex = (selectedBlockText.lastIndexOf(` ${CHANNEL_CHAR}`, focusOffset) || 0) + 1;

  if (selectedBlockText.length === channelIndex + 1) {
    focusOffset = selectedBlockText.length;
  }

  if (selectedBlockText[focusOffset] === ' ') {
    spaceAlreadyPresent = true;
  }

  let updatedSelection = editorState.getSelection().merge({
    anchorOffset: channelIndex,
    focusOffset,
  });
  let newEditorState = EditorState.acceptSelection(editorState, updatedSelection);
  let contentState = Modifier.replaceText(
    newEditorState.getCurrentContent(),
    updatedSelection,
    channelAsString,
    newEditorState.getCurrentInlineStyle(),
    entityKey,
  );

  newEditorState = EditorState.push(newEditorState, contentState, 'insert-characters');

  if (!spaceAlreadyPresent && options.addSpaceAfter) {
    // insert a blank space after mention
    updatedSelection = newEditorState.getSelection().merge({
      anchorOffset: channelIndex + channelAsString.length,
      focusOffset: channelIndex + channelAsString.length,
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

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<ChannelSuggestionType> => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findChannelEntities,
    component: Channel,
  },
  trigger: /\B#([a-zA-Z\u00C0-\u017F]+)$/,
  resourceType: ChannelResourceType,
  onSelected: (channel: ChannelSuggestionType, editorState: EditorState, options: SelectOrInsertOptions = { addSpaceAfter: true }) => addChannel(channel, editorState, options),
  renderSuggestion: (channel: ChannelSuggestionType) => ChannelSuggestion(channel),
});
