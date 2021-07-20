import React from 'react';

import { ChannelResource } from 'app/models/Channel';
import { Collection } from 'services/CollectionsReact/Collections';
import RouterServices from 'app/services/RouterService';
import WorkspaceChannels from './WorkspaceChannel';
import Languages from 'services/languages/languages';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import { getDirectChannels, getMine } from 'app/services/channels/ChannelCollectionPath';

type channelCategoryType = {
  favorite: ChannelResource[];
  workspace: ChannelResource[];
  inGroup: ChannelResource[];
  direct: ChannelResource[];
};

export default () => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();
  const channelCategory: channelCategoryType = {
    favorite: [],
    workspace: [],
    inGroup: [],
    direct: [],
  };
  const channelsCollection = Collection.get(
    getMine(companyId, workspaceId),
    ChannelResource,
  ).setOptions({ reloadStrategy: 'delayed', queryParameters: { mine: true } });
  const directChannelsCollection = Collection.get(
    getDirectChannels(companyId),
    ChannelResource,
  ).setOptions({ reloadStrategy: 'delayed' });
  const channels = channelsCollection.useWatcher(
    {},
    { observedFields: ['id', 'channel_group', 'user_member.favorite'], query: { mine: true } },
  );
  const directChannels = directChannelsCollection.useWatcher(
    {},
    { observedFields: ['id', 'user_member.favorite'] },
  );

  ChannelsBarService.wait(companyId, workspaceId, channelsCollection);

  channels
    .concat(directChannels)
    .filter(a => a.data.user_member?.user_id)
    .sort((a, b) => (a.data.name || '').localeCompare(b.data.name || ''))
    .map(channel => {
      switch (true) {
        case channel.data.user_member?.favorite:
          channelCategory.favorite.push(channel);
          break;
        case channel.data.visibility === 'direct':
          channelCategory.direct.push(channel);
          break;
        case channel.data.channel_group && channel.data.channel_group.length > 1:
          channelCategory.inGroup.push(channel);
          break;
        default:
          channelCategory.workspace.push(channel);
      }
    });

  const groupsName: string[] = [];
  const groups: { name: string; channels: ChannelResource[] }[] = [];
  const hasNonGroupWorkspaceChannels = !(
    channelCategory.workspace.length === 0 && channelCategory.inGroup.length !== 0
  );

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
          directCollection={directChannelsCollection}
          collection={channelsCollection}
          key={'favoriteChannels'}
          sectionTitle={Languages.t(
            'scenes.app.channelsbar.channelsworkspace.channel_title.favorite',
          )}
          channels={channelCategory.favorite}
          favorite
        />
      )}
      {hasNonGroupWorkspaceChannels && (
        <WorkspaceChannels
          directCollection={directChannelsCollection}
          collection={channelsCollection}
          key={'channels'}
          sectionTitle={Languages.t('scenes.app.channelsbar.channelsworkspace.channel_title')}
          channels={channelCategory.workspace}
        />
      )}
      {groups.map((group, index) => (
        <WorkspaceChannels
          directCollection={directChannelsCollection}
          collection={channelsCollection}
          key={index}
          sectionTitle={group.name}
          channels={group.channels}
          subgroup={hasNonGroupWorkspaceChannels}
        />
      ))}
    </div>
  );
};
