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

  return (
    <div className="result-item" onClick={onClick}>
      <div className="result-item-icon">{avatar}</div>
    </div>
  );
};
