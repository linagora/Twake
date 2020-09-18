import React, { Component } from 'react';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import Moment from 'react-moment';
import moment from 'moment';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import ChannelsService from 'services/channels/channels.js';
import MenusManager from 'services/Menus/MenusManager.js';
import UserCard from 'app/components/UserCard/UserCard.js';
import { getSender } from 'services/Apps/Messages/MessagesUtils';

type Props = {
  message: Message;
  collectionKey: string;
  linkToThread?: boolean;
};

type State = {
  messageLink: string;
};

export default class MessageHeader extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      messageLink: '',
    };
  }
  render() {
    let user_name_node: any = null;

    const updateMessageLink = () => {
      const url = ChannelsService.getURL(
        this.props.message.channel_id,
        this.props.message.parent_message_id || this.props.message.id,
      );
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
      Collections.get('users').addListener(this);
      Collections.get('users').listenOnly(this, [senderData.type.id]);
    }

    return (
      <div className="message-content-header">
        <span
          className="sender-name"
          ref={node => (user_name_node = node)}
          onClick={() => displayUserCard(senderData)}
        >
          {User.getFullName(senderData)}
        </span>
        {this.props.message.creation_date && (
          <a
            className="date"
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
          </a>
        )}
      </div>
    );
  }
}
