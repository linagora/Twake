import React from 'react';
import { Tooltip } from 'antd';
import { Calendar, CheckSquare, Folder, Hexagon, Star } from 'react-feather';
import WritingLoader from 'app/components/writing-loader/writing-loader';
import Icon from 'app/components/icon/icon';
import { Application } from 'app/features/applications/types/application';
import Emojione from 'components/emojione/emojione';
import Beacon from 'app/components/scroll-hidden-components/beacon';
import RouterServices from 'app/features/router/services/router-service';

import './Channel.scss';
import AvatarComponent from 'app/components/avatar/avatar';
import { AtSymbolIcon, BellIcon } from '@heroicons/react/outline';

type Props = {
  app?: Application;
  name: string;
  icon: string | JSX.Element;
  id?: string;
  channelId?: string;
  notificationLevel: 'all' | 'none' | 'mentions' | 'me';
  favorite: boolean;
  unreadMessages: number;
  mentions: number;
  replies: number;
  unread: number;
  visibility: string; //"private" | "public" | "direct"
  directMembers?: string[];
  menu?: JSX.Element;
  showTooltip?: boolean;
  active?: boolean;
  writingActivity?: boolean;
  selected?: boolean;
};

export default (props: Props) => {
  const selected = props.selected;
  const writingActivity = props.writingActivity || false;

  const onClick = () => {
    const url = RouterServices.generateRouteFromState({
      channelId: props.id,
    });
    RouterServices.push(url);
  };

  const getDefaultApplicationIcon = (app: Application) => {
    switch (app.identity.code) {
      case 'twake_tasks':
        return <CheckSquare size={16} color={selected ? 'var(--white)' : 'var(--black)'} />;
      case 'twake_calendar':
        return <Calendar size={16} color={selected ? 'var(--white)' : 'var(--black)'} />;
      case 'twake_drive':
        return <Folder size={16} color={selected ? 'var(--white)' : 'var(--black)'} />;

      default:
        return props.app?.identity.icon ? (
          <AvatarComponent url={props.app?.identity.icon} size={16} />
        ) : (
          <Hexagon size={16} color={selected ? 'var(--white)' : 'var(--black)'} />
        );
    }
  };

  const grayBadgeClassName = ' bg-zinc-300 text-zinc-700 dark:bg-zing-800 dark:text-zinc-600';
  const blueBadgeClassName = ' text-white bg-blue-500';

  return (
    <Tooltip title={props.showTooltip ? props.name : false} placement="right" mouseEnterDelay={3}>
      <div
        className={`channel ${selected ? 'selected ' : ''} ${props.active ? 'menu-open' : ''}`}
        onClick={onClick}
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
        {!!props.app && <div className="icon">{getDefaultApplicationIcon(props.app)}</div>}
        <div className="text" style={{ textTransform: 'capitalize' }}>
          {props.name + ' '}
          {props.visibility === 'private' && <Icon type="lock merge-icon black-icon" />}
        </div>
        <div className="writing_activity">{!selected && writingActivity && <WritingLoader />}</div>
        <div className="more">
          {props.notificationLevel === 'none' && <Icon type="bell-slash merge-icon grey-icon" />}
          {props.unread > 0 && props.mentions + props.replies === 0 && (
            <div
              className={
                'text-xs font-medium h-5 w-5 flex items-center justify-center text-sm rounded-full ml-1' +
                blueBadgeClassName
              }
            >
              <BellIcon className="h-4 w-4" />
              <Beacon tag="channel_bar_component" />
            </div>
          )}
          {props.mentions + props.replies > 0 && (
            <div
              className={
                'text-xs font-medium h-5 w-5 flex items-center justify-center text-sm rounded-full ml-1' +
                (props.notificationLevel === 'none' ? grayBadgeClassName : blueBadgeClassName)
              }
            >
              <AtSymbolIcon className="h-4 w-4" />
              <Beacon tag="channel_bar_component" />
            </div>
          )}
          {!(props.visibility === 'direct' && props.mentions + props.replies === 0) &&
            ((props.unreadMessages > 0 && props.mentions + props.replies === 0) ||
              props.mentions + props.replies > 1) && (
              <div
                className={
                  'text-xs font-medium h-5 px-1.5 flex items-center justify-center text-sm rounded-full ml-1' +
                  (props.notificationLevel === 'all' ||
                  (props.mentions + props.replies > 0 && props.notificationLevel !== 'none')
                    ? blueBadgeClassName
                    : grayBadgeClassName)
                }
              >
                {Math.min(
                  99,
                  Math.max(1, Math.max(props.mentions + props.replies, props.unreadMessages)),
                )}
              </div>
            )}
          {props.menu}
        </div>
      </div>
    </Tooltip>
  );
};
