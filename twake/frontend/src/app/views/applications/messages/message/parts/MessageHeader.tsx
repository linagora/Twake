import React, { ReactNode, useContext, useState } from 'react';

import 'moment-timezone';
import Moment from 'react-moment';
import { Typography } from 'antd';
import classNames from 'classnames';
import { AlertTriangle } from 'react-feather';
import { useRecoilState } from 'recoil';

import User from 'app/features/users/services/current-user-service';
import MenusManager from 'app/components/menus/menus-manager.jsx';
import UserCard from 'app/components/user-card/user-card';
import Emojione from 'components/emojione/emojione';
import RouterServices from 'app/features/router/services/router-service';
import { NodeMessage } from 'app/features/messages/types/message';
import Languages from 'app/features/global/services/languages-service';
import Loader from 'components/loader/loader.jsx';
import { useMessage } from 'app/features/messages/hooks/use-message';
import { MessageContext } from '../message-with-replies';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import { useUser } from 'app/features/users/hooks/use-user';
import { UserType } from 'app/features/users/types/user';
import { CompanyApplicationsStateFamily } from 'app/features/applications/state/company-applications';
import { useDirectChannels } from 'app/features/channels/hooks/use-direct-channels';
import { addUrlTryDesktop } from 'app/views/desktop-redirect';

type Props = {
  linkToThread?: boolean;
};

const { Link } = Typography;

export default (props: Props) => {
  const channelId = useRouterChannel();
  const workspaceId = useRouterWorkspace();
  const [messageLink, setMessageLink] = useState('');
  const { openDiscussion } = useDirectChannels();

  const context = useContext(MessageContext);
  const { message } = useMessage(context);
  const parentMessage: NodeMessage | null = useMessage({
    ...context,
    id: message.thread_id,
  }).message;

  const user = useUser(message.user_id);

  const companyApplications =
    useRecoilState(CompanyApplicationsStateFamily(context.companyId))[0] || [];
  const application = companyApplications.find(a => a.id === message.application_id);

  const scrollToMessage = () => {
    if (message.thread_id !== message.id) {
      //TODO messageService.scrollTo({ id: message.thread_id });
    }
  };

  const updateMessageLink = () => {
    const url = RouterServices.generateRouteFromState({
      workspaceId: workspaceId,
      channelId: channelId,
      messageId: message.thread_id || message.id,
    });
    setMessageLink(url);
  };

  let userNameRef: ReactNode = null;
  const displayUserCard = () => {
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const box = (window as any).getBoundingClientRect(userNameRef);
      MenusManager.openMenu(
        [
          {
            type: 'react-element',
            reactElement: () => (
              <UserCard
                user={user as UserType}
                onClick={() => openDiscussion([(user as UserType).id || ''])}
              />
            ),
          },
        ],
        box,
        null,
        { margin: 8 },
      );
    }
  };

  const icon = user?.status ? user.status.split(' ')[0] : undefined;
  const status = user?.status ? user.status.split(' ').splice(1).join(' ') : undefined;
  return (
    <div
      className={classNames('message-content-header-container', {
        'message-not-sent': message._status === 'failed',
      })}
    >
      <div className={'message-content-header '}>
        <span
          className="sender-name"
          ref={node => (userNameRef = node as ReactNode)}
          onClick={() => displayUserCard()}
        >
          {message.override?.title ||
            (!!user && User.getFullName(user)) ||
            (message.application_id && application?.identity?.name)}
        </span>
        {!!user && (
          <div className="sender-status">
            {!!icon && <Emojione size={12} type={icon} />} {!!status && status}
          </div>
        )}
        {props.linkToThread && (
          <span className="reply-text">
            {Languages.t('scenes.apps.messages.input.replied_to')}
            <Link onClick={() => scrollToMessage()}>{parentMessage?.text}</Link>
          </span>
        )}
        {message.created_at && (
          <a
            className="date"
            // eslint-disable-next-line react/jsx-no-target-blank
            target="_BLANK"
            href={messageLink ? addUrlTryDesktop(messageLink) : '#'}
            onMouseEnter={() => updateMessageLink()}
            rel="noreferrer"
          >
            <Moment
              format={
                new Date().getTime() - message.created_at > 12 * 60 * 60 * 1000 ? 'lll' : 'LT'
              }
            >
              {message.created_at}
            </Moment>

            {message.edited?.edited_at && (
              <span style={{ textTransform: 'lowercase' }}>
                {' '}
                - {Languages.t('scenes.apps.messages.input.edited', [], 'Edited')}
              </span>
            )}
          </a>
        )}
      </div>
      {message._status === 'sending' && (
        <div className="loading">
          <Loader color="#999" className="message_header_loader" />
        </div>
      )}
      {message._status === 'failed' && (
        <div className="alert_failed_icon">
          <AlertTriangle size={16} />
        </div>
      )}
    </div>
  );
};
