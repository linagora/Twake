import React from 'react';
import { Tooltip } from 'antd';
import { Calendar, CheckSquare, Folder, Star } from 'react-feather';

import Icon from 'app/components/icon/icon';
import { Application } from 'app/features/applications/types/application';
import WindowState from 'services/utils/window';
import Emojione from 'components/emojione/emojione';
import { ChannelResource } from 'app/features/channels/types/channel';
import AvatarComponent from 'app/components/avatar/avatar';
import Beacon from 'app/components/scroll-hidden-components/beacon';
import MainViewService from 'app/services/AppView/MainViewService';
import { Collection } from 'app/services/CollectionsReact/Collections';
import useRouterChannelSelected from 'app/features/router/hooks/use-router-channel-selected';

import './Channel.scss';
import useChannelWritingActivity, {
  useChannelWritingActivityState,
} from 'app/features/channels/hooks/use-channel-writing-activity';
import WritingLoader from 'app/components/writing-loader/writing-loader';

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
  writingActivity?: boolean;
};

export default (props: Props) => {
  const selected = useRouterChannelSelected(props.id || '');
  const writingActivity = useChannelWritingActivityState(props.id || '');

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

  const getDefaultApplicationIcon = (code: string) => {
    switch (code) {
      case 'twake_tasks':
        return <CheckSquare size={16} color={selected ? 'var(--white)' : 'var(--black)'} />;
      case 'twake_calendar':
        return <Calendar size={16} color={selected ? 'var(--white)' : 'var(--black)'} />;
      case 'twake_drive':
        return <Folder size={16} color={selected ? 'var(--white)' : 'var(--black)'} />;
      default:
        return <></>;
    }
  };

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
          <div className="icon">{getDefaultApplicationIcon(props.app.identity.code)}</div>
        )}
        <div className="text" style={{ textTransform: 'capitalize' }}>
          {props.name + ' '}
          {props.visibility === 'private' && <Icon type="lock merge-icon black-icon" />}
        </div>
        <div className="writing_Activity">
          {!selected && writingActivity.length > 0 && <WritingLoader />}
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
