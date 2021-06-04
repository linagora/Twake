import { ContentBlock, ContentState, EditorState, Modifier } from "draft-js";
import { Channel } from "./Channel";
import ChannelsService from 'services/channels/channels';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { getInsertRange } from "../../EditorUtils";
import ChannelSuggestion from "./ChannelSuggestion";
import { EditorSuggestionPlugin } from "../../EditorPlugins";

export type ChannelSuggestionType = ChannelType & { autocomplete_id: number };

export const ChannelResourceType = "CHANNEL";

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

const addChannel = (channel: ChannelSuggestionType, editorState: EditorState): EditorState => {
  const { start, end } = getInsertRange(editorState, "#")
  const contentState = editorState.getCurrentContent()
  const currentSelection = editorState.getSelection()
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  })
  
  const contentStateWithEntity = contentState.createEntity(ChannelResourceType, 'IMMUTABLE', channel);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const channelAsString = (channel.name || "").toLocaleLowerCase().replace(/[^a-z0-9_\-.\u00C0-\u017F]/g, '');

  const newContentState = Modifier.replaceText(
    contentStateWithEntity,
    selection,
    `#${channelAsString}`,
    undefined,
    entityKey);

  const newEditorState = EditorState.push(
    editorState, newContentState, "insert-fragment"
  );

  return EditorState.forceSelection( newEditorState, newContentState.getSelectionAfter());
};

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<ChannelSuggestionType> => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findChannelEntities,
    component: Channel,
  },
  trigger: /\B#([a-zA-Z\u00C0-\u017F]+)$/,
  resourceType: ChannelResourceType,
  onSelected: (channel: ChannelSuggestionType, editorState: EditorState) => addChannel(channel, editorState),
  renderSuggestion: (channel: ChannelSuggestionType) => ChannelSuggestion(channel),
});
