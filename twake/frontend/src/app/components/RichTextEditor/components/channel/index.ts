import { ContentBlock, ContentState } from "draft-js";
import { Channel } from "./Channel";
import ChannelsService from 'services/channels/channels';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import { EditorSuggestionPlugin } from "../../Editor";

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
    console.log("CHANNELS", text, channels);
    if (!channels || !channels.length) {
      callback([]);
      return;
    }

    return callback(channels.map((channel, index) => ({ ...channel.data, ...{ autocomplete_id: index }})));
  });
}

export default (options: { maxSuggestions: number } = { maxSuggestions: 10 }): EditorSuggestionPlugin<ChannelSuggestionType> => ({
  resolver: (text, callback) => resolver(text, options.maxSuggestions, callback),
  decorator: {
    strategy:  findChannelEntities,
    component: Channel,
  },
  trigger: /\B#([a-zA-Z\u00C0-\u017F]+)$/,
  resourceType: ChannelResourceType,
});
