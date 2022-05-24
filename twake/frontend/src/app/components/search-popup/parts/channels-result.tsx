import React from 'react';
import '../search-popup.scss';

import { ChannelType } from 'app/features/channels/types/channel';
import { useWorkspace } from 'features/workspaces/hooks/use-workspaces';
import assert from 'assert';
import Emojione from 'components/emojione/emojione';
import RouterServices from 'features/router/services/router-service';
import { highlightText } from 'components/search-popup/parts/common';
const emoji = require('emoji-name-map');

type PropsType = {
  channel: ChannelType;
  highlight: string;
  onClick: any;
};

export default ({ channel, highlight, onClick }: PropsType): JSX.Element => {
  assert(channel.workspace_id);
  assert(channel.name);
  assert(channel.icon);
  const { workspace } = useWorkspace(channel.workspace_id);
  const thumbnail = emoji.get(channel.icon);

  const onItemClick = async () => {
    assert(channel.company_id);
    assert(channel.workspace_id);
    assert(channel.id);
    const params = {
      companyId: channel.company_id,
      workspaceId: channel.workspace_id,
      channelId: channel.id,
    };
    RouterServices.push(RouterServices.generateRouteFromState(params));
    onClick();
  };

  return (
    channel && (
      <div className="result-item" onClick={onItemClick}>
        <div className="result-item-channel-icon">
          <div className="result-item-icon-title">{thumbnail}</div>
        </div>
        <div className="result-item-content">
          <div
            className="channel-title"
            dangerouslySetInnerHTML={{ __html: highlightText(channel.name, highlight) }}
          />
          <div className="channel-description">{workspace?.name}</div>
        </div>
        <div className="result-item-postfix"></div>
      </div>
    )
  );
};
