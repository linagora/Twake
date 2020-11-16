import React from 'react';
import { Tooltip, Avatar, Badge } from 'antd';
import { Menu } from 'antd';

import './Channel.scss';

import Emojione from 'components/Emojione/Emojione';
import Icon from 'components/Icon/Icon.js';
// import User from 'components/User/User.js';
// import Draggable from 'components/Draggable/Draggable.js';
// import Tooltip from 'components/Tooltip/Tooltip.js';
// import Languages from 'services/languages/languages.js';

type Props = {
  name: string;
  icon: string | JSX.Element;
  selected: boolean;
  muted: boolean;
  favorite: boolean;
  unreadMessages: boolean;
  visibility: string; //"private" | "public" | "direct"
  isAppchannel?: boolean;
  directMembers?: string[];
  notifications: number;
  options: object;
  onClick?: (evt: any) => void;
};

export default (props: Props) => {
  return (
    <div
      className={'channel fade_in ' + (props.selected ? 'selected ' : '')}
      onClick={props.onClick}
    >
      {(props.visibility === 'public' || props.visibility === 'private') &&
        typeof props.icon === 'string' && (
          <div className="icon">
            <Emojione type={props.icon} />
          </div>
        )}
      {props.visibility === 'direct' && typeof props.icon === 'object' && (
        <div className="direct-channel"> {props.icon}</div>
      )}
      {props.isAppchannel && (
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
        <div className="more-icon">
          <Icon type="ellipsis-h more-icon grey-icon" />
        </div>
      </div>
    </div>
  );
};
