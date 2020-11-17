import React from 'react';

import './Channel.scss';

import RouterService from 'services/RouterServices';
import Emojione from 'components/Emojione/Emojione';
import Icon from 'components/Icon/Icon.js';

type Props = {
  name: string;
  icon: string | JSX.Element;
  id?: string;
  muted: boolean;
  favorite: boolean;
  unreadMessages: boolean;
  visibility: string; //"private" | "public" | "direct"
  isAppchannel?: boolean;
  directMembers?: string[];
  notifications: number;
  menu?: JSX.Element;
};

export default (props: Props) => {
  const { channelId } = RouterService.useStateFromRoute();

  const selected = channelId === props.id;

  return (
    <div
      className={'channel fade_in ' + (selected ? 'selected ' : '')}
      onClick={() => {
        RouterService.history.push(RouterService.generateRouteFromState({ channelId: props.id }));
      }}
    >
      {!props.isAppchannel &&
        (props.visibility === 'public' || props.visibility === 'private') &&
        typeof props.icon === 'string' && (
          <div className="icon">
            <Emojione type={props.icon} />
          </div>
        )}
      {!props.isAppchannel && props.visibility === 'direct' && typeof props.icon === 'object' && (
        <div className="direct-channel-avatars"> {props.icon}</div>
      )}
      {!!props.isAppchannel && (
        <div className="icon">
          <Icon type={props.icon} />
        </div>
      )}
      <div className="text">{props.name}</div>
      <div className="more">
        {props.visibility === 'private' && <Icon type="lock merge-icon black-icon" />}
        {props.muted && <Icon type="bell-slash merge-icon grey-icon" />}
        {props.notifications > 0 && (
          <div className="notification_dot">{Math.max(1, props.notifications)}</div>
        )}
        {props.menu}
      </div>
    </div>
  );
};
