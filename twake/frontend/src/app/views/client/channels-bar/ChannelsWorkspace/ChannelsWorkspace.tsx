import React from 'react';

import { ChannelType } from 'app/features/channels/types/channel';
import WorkspaceChannels from './WorkspaceChannel';
import Languages from 'app/features/global/services/languages-service';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';
import { usePublicOrPrivateChannels } from 'app/features/channels/hooks/use-public-or-private-channels';

type channelCategoryType = {
  favorite: ChannelType[];
  workspace: ChannelType[];
  inGroup: ChannelType[];
  direct: ChannelType[];
};

export default () => {
  const channelCategory: channelCategoryType = {
    favorite: [],
    workspace: [],
    inGroup: [],
    direct: [],
  };
  const { privateChannels, publicChannels } = usePublicOrPrivateChannels();
  const { directChannels } = useDirectChannels();

  const channels: ChannelType[] = [...privateChannels, ...publicChannels];

  channels
    .concat(directChannels)
    .filter(a => a.user_member?.user_id)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .forEach(channel => {
      switch (true) {
        case channel.user_member?.favorite:
          channelCategory.favorite.push(channel);
          break;
        case channel.visibility === 'direct':
          channelCategory.direct.push(channel);
          break;
        case channel.channel_group && channel.channel_group.length > 1:
          channelCategory.inGroup.push(channel);
          break;
        default:
          channelCategory.workspace.push(channel);
      }
    });

  const groupsName: string[] = [];
  const groups: { name: string; channels: ChannelType[] }[] = [];
  const hasNonGroupWorkspaceChannels = !(
    channelCategory.workspace.length === 0 && channelCategory.inGroup.length !== 0
  );

  channelCategory.inGroup.forEach(channel => {
    if (channel.channel_group && channel.channel_group.length > 1) {
      if (groups.length === 0) {
        groupsName.push(channel.channel_group);
        groups.push({
          name: channel.channel_group,
          channels: [channel],
        });
      } else {
        if (groupsName.includes(channel.channel_group)) {
          const groupIndex = groups.findIndex(group => group.name === channel.channel_group);
          groups[groupIndex].channels.push(channel);
        } else {
          groupsName.push(channel.channel_group);
          groups.push({
            name: channel.channel_group,
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
          sectionTitle={Languages.t(
            'scenes.app.channelsbar.channelsworkspace.channel_title.favorite',
          )}
          channels={channelCategory.favorite}
          favorite
        />
      )}
      {hasNonGroupWorkspaceChannels && (
        <WorkspaceChannels
          key={'channels'}
          sectionTitle={Languages.t('scenes.app.channelsbar.channelsworkspace.channel_title')}
          channels={channelCategory.workspace}
        />
      )}
      {groups.map((group, index) => (
        <WorkspaceChannels
          key={index}
          sectionTitle={group.name}
          channels={group.channels}
          subgroup={hasNonGroupWorkspaceChannels}
        />
      ))}
    </div>
  );
};
