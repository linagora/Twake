import React from 'react';
import { Tooltip } from 'antd';
import { Star } from 'react-feather';

import Icon from 'components/Icon/Icon';
import { Application } from 'app/models/App';
import WindowState from 'services/utils/window';
import Emojione from 'components/Emojione/Emojione';
import { ChannelResource } from 'app/models/Channel';
import AvatarComponent from 'app/components/Avatar/Avatar';
import Beacon from 'app/components/ScrollHiddenComponents/Beacon';
import MainViewService from 'app/services/AppView/MainViewService';
import { Collection } from 'app/services/CollectionsReact/Collections';
import useRouterChannelSelected from 'app/state/recoil/hooks/router/useRouterChannelSelected';

import './Channel.scss';

type Props = {
  collection?: Collection<ChannelResource>;
  app?: Application;
  name: string;
  icon: string | JSX.Element;
  id?: string;
  channelId?: string;
  muted: boolean;
  favorite: boolean;
  unreadMessages: boolean;
  visibility: string; //"private" | "public" | "direct"
  directMembers?: string[];
  notifications: number;
  menu?: JSX.Element;
  showTooltip?: boolean;
  active?: boolean;
};

export default (props: Props) => {
  const selected = useRouterChannelSelected(props.id || '');

  const onChannelChange = () => {
    props.id &&
      MainViewService.select(props.id, {
        collection: props.collection,
        app: props.app || {
          identity: {
            code: 'messages',
            name: '',
            icon: '',
            description: '',
            website: '',
            categories: [],
            compatibility: [],
          },
        },
        context: null,
        hasTabs: props.visibility !== 'direct' && !props.app,
      });

    WindowState.setSuffix(props.name);
  };

  if (selected && props.id && MainViewService.getId() !== props.id) onChannelChange();

  return (
    <Tooltip title={props.showTooltip ? props.name : false} placement="right" mouseEnterDelay={3}>
      <div
        className={`channel ${selected ? 'selected ' : ''} ${
          props.unreadMessages ? 'unread ' : ''
        } ${props.active ? 'menu-open' : ''}`}
        onClick={onChannelChange}
      >
        {!!props.favorite && (
          <div className="icon small-right-margin">
            <Star size={14} />
          </div>
        )}
        {!props.app &&
          (props.visibility === 'public' || props.visibility === 'private') &&
          typeof props.icon === 'string' && (
            <div className="icon">
              <Emojione type={props.icon} />
            </div>
          )}
        {!props.app && props.visibility === 'direct' && typeof props.icon === 'object' && (
          <div className="direct-channel-avatars"> {props.icon}</div>
        )}
        {!!props.app && (
          <div className="icon">
            <AvatarComponent borderRadius={0} size={16} url={props.icon as string} />
          </div>
        )}
        <div className="text" style={{ textTransform: 'capitalize' }}>
          {props.name + ' '}
          {props.visibility === 'private' && <Icon type="lock merge-icon black-icon" />}
        </div>
        <div className="more">
          {props.muted && <Icon type="bell-slash merge-icon grey-icon" />}
          {props.notifications > 0 && (
            <div className="notification_dot">
              {Math.max(1, props.notifications)}
              <Beacon tag="channel_bar_component" />
            </div>
          )}
          {props.menu}
        </div>
      </div>
    </Tooltip>
  );
};
