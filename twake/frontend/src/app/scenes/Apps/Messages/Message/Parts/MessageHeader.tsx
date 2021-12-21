import React, { ReactNode, useContext, useState } from 'react';

import 'moment-timezone';
import moment from 'moment';
import Moment from 'react-moment';
import { Typography } from 'antd';
import classNames from 'classnames';
import { AlertTriangle } from 'react-feather';

import User from 'services/user/UserService';
import ChannelsService from 'services/channels/channels.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import UserCard from 'app/components/UserCard/UserCard';
import Emojione from 'components/Emojione/Emojione';
import RouterServices from 'app/services/RouterService';
import { NodeMessage } from 'app/models/Message';
import Languages from 'services/languages/languages';
import Loader from 'components/Loader/Loader.js';
import { useMessage } from 'app/state/recoil/hooks/messages/useMessage';
import { MessageContext } from '../MessageWithReplies';
import useRouterWorkspace from 'app/state/recoil/hooks/router/useRouterWorkspace';
import useRouterChannel from 'app/state/recoil/hooks/router/useRouterChannel';
import { useUser } from 'app/state/recoil/hooks/useUser';
import { UserType } from 'app/models/User';
import { useCompanyApplications } from 'app/state/recoil/hooks/useCompanyApplications';
import { useRecoilState, useRecoilStateLoadable } from 'recoil';
import { UsersState } from 'app/state/recoil/atoms/Users';
import { CompanyApplicationsStateFamily } from 'app/state/recoil/atoms/CompanyApplications';

type Props = {
  linkToThread?: boolean;
};

const { Link } = Typography;

export default (props: Props) => {
  const channelId = useRouterChannel();
  const workspaceId = useRouterWorkspace();
  const [messageLink, setMessageLink] = useState('');

  const context = useContext(MessageContext);
  let { message } = useMessage(context);
  let parentMessage: NodeMessage | null = useMessage({ ...context, id: message.thread_id }).message;

  let user = useUser(message.user_id);
  const companyApplications =
    useRecoilState(CompanyApplicationsStateFamily(context.companyId))[0] || [];
  let application = companyApplications.find(a => a.id === message.application_id);

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
      let box = (window as any).getBoundingClientRect(userNameRef);
      MenusManager.openMenu(
        [
          {
            type: 'react-element',
            reactElement: () => (
              <UserCard
                user={user as UserType}
                onClick={() => ChannelsService.openDiscussion([(user as UserType).id])}
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
  const status = user?.status ? user.status.split(' ').splice(1).join(" ") : undefined;
  return (
    <div
      className={classNames('message-content-header-container', {
        'message-not-sent': message._status === 'failed',
      })}
    >
      <div className={'message-content-header '}>
        <span
          className="sender-name"
          ref={node => (userNameRef = node)}
          onClick={() => displayUserCard()}
        >
          {message.override?.title ||
            (!!user && User.getFullName(user)) ||
            (message.application_id && application?.identity?.name)}
        </span>
        {!message.application_id && !!user && (
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
            href={messageLink || '#'}
            onMouseEnter={() => updateMessageLink()}
            rel="noreferrer"
          >
            <Moment
              tz={moment.tz.guess()}
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
