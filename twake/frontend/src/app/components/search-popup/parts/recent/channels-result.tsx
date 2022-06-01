import { ChannelType } from 'features/channels/types/channel';
import assert from 'assert';
import { useWorkspace } from 'features/workspaces/hooks/use-workspaces';
import RouterServices from 'features/router/services/router-service';
import { highlightText } from 'components/search-popup/parts/common';
import React from 'react';
import { getUserParts } from 'components/member/user-parts';
import ChannelAvatar from 'components/channel-avatar/channel-avatar';

type PropsType = {
  channel: ChannelType;
  onClick: any;
};

export default ({ channel, onClick }: PropsType): JSX.Element => {
  assert(channel.workspace_id, 'No workspace_id in channel object');

  const isDirect = channel.visibility === 'direct';

  let { name } = isDirect
    ? getUserParts({
        usersIds: channel.members || [],
        displayOnline: false,
        size: 60,
      })
    : {
        name: channel.name,
      };

  const avatar = ChannelAvatar({ channel, showLabel: true });

  // assert(channel.icon, 'No icon in channel object');
  const { workspace } = useWorkspace(channel.workspace_id);
  // const thumbnail = emoji.get(channel.icon);

  const onItemClick = async () => {
    //   assert(channel.company_id);
    //   assert(channel.workspace_id);
    //   assert(channel.id);
    //   const params = {
    //     companyId: channel.company_id,
    //     workspaceId: channel.workspace_id,
    //     channelId: channel.id,
    //   };
    //   RouterServices.push(RouterServices.generateRouteFromState(params));
    //   onClick();
  };

  return (
    <div className="result-item" onClick={onClick}>
      <div className="result-item-icon">{avatar}</div>
    </div>
  );

  return <div>ok</div>;
};
