import React, { Component } from 'react';
import User from 'services/user/user.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import 'moment-timezone';
import Moment from 'react-moment';
import moment from 'moment';
import ChannelsService from 'services/channels/channels.js';
import MenusManager from 'app/components/Menus/MenusManager.js';
import UserCard from 'app/components/UserCard/UserCard.js';
import { getSender } from 'services/Apps/Messages/MessagesUtils';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import Emojione from 'components/Emojione/Emojione';
import ListenUsers from 'services/user/listen_users.js';
import Workspaces from 'services/workspaces/workspaces.js';
import RouterServices from 'app/services/RouterService';
import { Message } from 'app/services/Apps/Messages/Message';
import { MessageListService } from 'app/services/Apps/Messages/MessageListService';
import MessageListServiceFactory from 'app/services/Apps/Messages/MessageListServiceFactory';

type Props = {
  message: Message;
  collectionKey: string;
  linkToThread?: boolean;
};

type State = {
  messageLink: string;
};

export default class MessageHeader extends Component<Props, State> {
  private messageService: MessageListService | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      messageLink: '',
    };

    this.messageService = MessageListServiceFactory.get(this.props.collectionKey);
  }

  componentWillUnmount() {
    const senderData = getSender(this.props.message);
    if (senderData.type === 'user') {
      ListenUsers.cancelListenUser(senderData.id);
    }
    Collections.get('users').removeListener(this);
  }

  render() {
    let user_name_node: any = null;

    if (!this.messageService) {
      return <></>;
    }

    const scrollToMessage = () => {
      if (!this.messageService) {
        return;
      }

      if (this.props.message.parent_message_id) {
        this.messageService.scrollTo({ id: this.props.message.parent_message_id });
      }
    };

    const updateMessageLink = () => {
      const workspace = Collections.get('workspaces').find(Workspaces.currentWorkspaceId);
      const url = RouterServices.generateRouteFromState({
        workspaceId: workspace.id,
        channelId: this.props.message.channel_id,
        messageId: this.props.message.parent_message_id || this.props.message.id,
      });
      this.setState({ messageLink: url });
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

    let senderData: any = getSender(this.props.message);
    if (senderData.type === 'user') {
      ListenUsers.listenUser(senderData.id);
      Collections.get('users').addListener(this);
      Collections.get('users').listenOnly(this, [senderData.id]);
    }

    let parentMessage: Message | null = null;
    if (this.props.linkToThread) {
      parentMessage = Collections.get('messages').find(this.props.message.parent_message_id);
    }

    return (
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

        {this.props.linkToThread && (
          <span className="reply-text">
            replied to{' '}
            <a href="#" onClick={() => scrollToMessage()}>
              {PseudoMarkdownCompiler.compileToSimpleHTML(
                parentMessage?.content,
                parentMessage?.message_type == 1,
              )}
            </a>
          </span>
        )}

        {this.props.message.creation_date && (
          <a
            className="date"
            target="_BLANK"
            href={this.state.messageLink || '#'}
            onMouseEnter={() => updateMessageLink()}
          >
            <Moment
              tz={moment.tz.guess()}
              format={
                new Date().getTime() - this.props.message.creation_date * 1000 > 12 * 60 * 60 * 1000
                  ? 'lll'
                  : 'LT'
              }
            >
              {this.props.message.creation_date * 1000}
            </Moment>

            {this.props.message.edited && ' - edited'}
          </a>
        )}
      </div>
    );
  }
}
