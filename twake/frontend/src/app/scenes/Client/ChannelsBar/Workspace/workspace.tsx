import React from 'react';

import { ChannelType } from 'app/models/Channel';
import { ChannelResource } from 'app/models/Channel';
import { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'services/RouterServices';
import WorkspaceChannels from 'components/Leftbar/Channel/workspaceChannels';

type channelCategoryType = {
  favorite: ChannelResource[];
  workspace: ChannelResource[];
  inGroup: ChannelResource[];
};

export function Workspace() {
  let channelCategory: channelCategoryType = {
    favorite: [],
    workspace: [],
    inGroup: [],
  };

  const { workspaceId, companyId } = RouterServices.useStateFromRoute();
  const url: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;
  const channelsCollection = Collection.get(url, ChannelResource, { tag: 'mine' });

  const channels = channelsCollection.useWatcher({}, { query: { mine: true } });

  channels.map(channel => {
    switch (true) {
      case channel.data.user_member?.favorite:
        channelCategory.workspace.push(channel);
        channelCategory.favorite.push(channel);
        break;
      case channel.data.channel_group && channel.data.channel_group.length > 1:
        channelCategory.inGroup.push(channel);
        break;
      default:
        channelCategory.workspace.push(channel);
    }
  });

  let groupsName: string[] = [];
  let groups: { name: string; channels: ChannelResource[] }[] = [];

  channelCategory.inGroup.map(channel => {
    if (channel.data.channel_group && channel.data.channel_group.length > 1) {
      if (groups.length === 0) {
        groupsName.push(channel.data.channel_group);
        groups.push({
          name: channel.data.channel_group,
          channels: [channel],
        });
      } else {
        if (groupsName.includes(channel.data.channel_group)) {
          const groupIndex = groups.findIndex(group => group.name === channel.data.channel_group);
          groups[groupIndex].channels.push(channel);
        } else {
          groupsName.push(channel.data.channel_group);
          groups.push({
            name: channel.data.channel_group,
            channels: [channel],
          });
        }
      }
    }
  });

  return (
    <div className="workspace_channels">
      {channelCategory.favorite.length !== 0 && (
        <WorkspaceChannels
          key={'favoriteChannels'}
          workspaceTitle="scenes.app.channelsbar.channelsworkspace.channel_title.favorite"
          channels={channelCategory.favorite}
        />
      )}
      {!(channelCategory.workspace.length === 0 && channelCategory.inGroup.length !== 0) && (
        <WorkspaceChannels
          key={'channels'}
          workspaceTitle="scenes.app.channelsbar.channelsworkspace.channel_title"
          channels={channelCategory.workspace}
        />
      )}
      {groups.map((group, index) => (
        <WorkspaceChannels key={index} workspaceTitle={group.name} channels={group.channels} />
      ))}
    </div>
  );
}
