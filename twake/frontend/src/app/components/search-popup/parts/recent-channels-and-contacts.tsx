import PerfectScrollbar from 'react-perfect-scrollbar';
import Search from 'features/global/services/search-service';
import React from 'react';
import RouterServices, { ClientStateType } from 'features/router/services/router-service';
import { ChannelType } from 'features/channels/types/channel';
import assert from 'assert';
import ChannelAvatar from 'components/channel-avatar/channel-avatar';

export default (): JSX.Element => {
  const onClick = (channel: ChannelType) => {
    const params = {
      companyId: channel.company_id,
      workspaceId: channel.workspace_id,
      channelId: channel.id,
    } as ClientStateType;
    RouterServices.push(RouterServices.generateRouteFromState(params));
    Search.close();
  };

  return (
    <div className="results-group">
      <div className="results-group-title">Recent channels and contacts</div>

      <PerfectScrollbar
        options={{ suppressScrollY: true }}
        component="div"
        className="result-items-channel"
      >
        {(Search.recent.channels.length &&
          Search.recent.channels.slice(0, 14).map(channel => (
            <ChannelItem
              channel={channel}
              key={channel.id}
              onClick={() => {
                onClick(channel);
              }}
            />
          ))) || <div />}
      </PerfectScrollbar>
    </div>
  );
};

const ChannelItem = ({ channel, onClick }: { channel: ChannelType; onClick: any }): JSX.Element => {
  assert(channel.workspace_id, 'No workspace_id in channel object');
  const avatar = ChannelAvatar({ channel, showLabel: true });
  return (
    <div className="result-item" onClick={onClick}>
      <div className="result-item-icon">{avatar}</div>
    </div>
  );
};
