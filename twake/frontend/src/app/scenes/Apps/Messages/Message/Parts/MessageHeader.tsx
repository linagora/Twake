import React, { Component, useEffect, useState } from 'react';
import 'moment-timezone';
import moment from 'moment';
import Moment from 'react-moment';
import User from 'services/user/UserService';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import ChannelsService from 'services/channels/channels.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import UserCard from 'app/components/UserCard/UserCard';
import { getSender } from 'services/Apps/Messages/MessagesUtils';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler';
import Emojione from 'components/Emojione/Emojione';
import ListenUsers from 'services/user/ListenUsers';
import Workspaces from 'services/workspaces/workspaces.js';
import RouterServices from 'app/services/RouterService';
import { Message } from 'app/models/Message';
import { MessageListService } from 'app/services/Apps/Messages/MessageListService';
import MessageListServiceFactory from 'app/services/Apps/Messages/MessageListServiceFactory';
import Languages from 'services/languages/languages';
import Loader from 'components/Loader/Loader.js';
import { AlertTriangle } from 'react-feather';

import classNames from 'classnames';

type Props = {
  message: Message;
  collectionKey: string;
  linkToThread?: boolean;
  loading: boolean;
  failed: boolean;
};

type State = {
  messageLink: string;
};

export default (props: Props) => {
  const [messageLink, setMessageLink] = useState('');
  const messageService = MessageListServiceFactory.get(props.collectionKey);

  useEffect(() => {
    return () => {
      const senderData = getSender(props.message);
      if (senderData.type === 'user') {
        ListenUsers.cancelListenUser(senderData.id);
      }
    };
  }, []);

  let user_name_node: any = null;

  if (!messageService) {
    return <></>;
  }

  const scrollToMessage = () => {
    if (!messageService) {
      return;
    }

    if (props.message.parent_message_id) {
      messageService.scrollTo({ id: props.message.parent_message_id });
    }
  };

  const updateMessageLink = () => {
    const workspace = Collections.get('workspaces').find(Workspaces.currentWorkspaceId);
    const url = RouterServices.generateRouteFromState({
      workspaceId: workspace.id,
      channelId: props.message.channel_id,
      messageId: props.message.parent_message_id || props.message.id,
    });
    setMessageLink(url);
  };

  const displayUserCard = (user: any) => {
    //@ts-ignore
    let box = window.getBoundingClientRect(user_name_node);

    MenusManager.openMenu(
      [
        {
          type: 'react-element',
          reactElement: () => (
            <UserCard user={user} onClick={() => ChannelsService.openDiscussion([user.id])} />
          ),
        },
      ],
      box,
      null,
      { margin: 8 },
    );
  };

  let senderData: any = getSender(props.message);
  if (senderData.type === 'user') {
    ListenUsers.listenUser(senderData.id);
    Collections.get('users').useListener(useState, [senderData.id]);
  }

  let parentMessage: Message | null = null;
  if (props.linkToThread) {
    parentMessage = Collections.get('messages').find(props.message.parent_message_id);
  }

  return (
    <div
      className={classNames('message-content-header-container', {
        'message-not-sent': props.failed,
      })}
    >
      <div className={'message-content-header '}>
        <span
          className="sender-name"
          ref={node => (user_name_node = node)}
          onClick={() => senderData.type === 'user' && displayUserCard(senderData)}
        >
          {User.getFullName(senderData)}
        </span>
        {senderData.type === 'user' && senderData.status_icon && senderData.status_icon[0] && (
          <div className="sender-status">
            <Emojione size={12} type={senderData.status_icon[0]} /> {senderData.status_icon[1]}
          </div>
        )}

        {props.linkToThread && (
          <span className="reply-text">
            replied to {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" onClick={() => scrollToMessage()}>
              {PseudoMarkdownCompiler.compileToSimpleHTML(
                parentMessage?.content,
                parentMessage?.message_type === 1,
              )}
            </a>
          </span>
        )}

        {props.message.creation_date && (
          <a
            className="date"
            // eslint-disable-next-line react/jsx-no-target-blank
            target="_BLANK"
            href={messageLink || '#'}
            onMouseEnter={() => updateMessageLink()}
          >
            <Moment
              tz={moment.tz.guess()}
              format={
                new Date().getTime() - props.message.creation_date * 1000 > 12 * 60 * 60 * 1000
                  ? 'lll'
                  : 'LT'
              }
            >
              {props.message.creation_date * 1000}
            </Moment>

            {props.message.edited && (
              <span style={{ textTransform: 'lowercase' }}>
                {' '}
                - {Languages.t('scenes.apps.messages.input.edited', [], 'Edited')}
              </span>
            )}
          </a>
        )}
      </div>
      {props.loading && (
        <div className="loading">
          <Loader color="#999" className="message_header_loader" />
        </div>
      )}
      {props.failed && !props.loading && (
        <div className="alert_failed_icon">
          <AlertTriangle size={16} />
        </div>
      )}
    </div>
  );
};
