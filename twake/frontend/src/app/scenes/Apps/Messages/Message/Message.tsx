import React, { Component } from 'react';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import MessagesService from 'services/Apps/Messages/Messages.js';
import Twacode from 'components/Twacode/Twacode.js';
import './Message.scss';

import Collections from 'services/Collections/Collections.js';
import User from 'services/user/user.js';

type Props = {
  message: Message & { fake: boolean };
  style: any;
};

export default class MessageComponent extends Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    if (this.props.message.fake === true) {
      return (
        <div className="thread-container loading" style={this.props.style}>
          <div className="thread with-block">
            <div className="thread-section">
              <div className="message">
                <div className="sender-space">
                  <div className="sender-head" />
                </div>
                <div className="message-content">
                  <div className="message-content-header">
                    <span className="sender-name"></span>
                  </div>
                  <div className="content-parent"></div>
                  <div className="content-parent" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    var user = null;

    if (this.props.message.sender) {
      user = Collections.get('users').known_objects_by_id[this.props.message.sender];
      if (!user) {
        User.asyncGet(this.props.message.sender);
      } else {
        Collections.get('users').listenOnly(this, [user.front_id]);
      }
    }

    return (
      <div className="thread-container" style={this.props.style}>
        <div className="thread with-block">
          <div className="thread-section">
            <div className="message">
              <div className="sender-space">
                <div
                  className="sender-head"
                  style={{
                    backgroundImage: "url('" + User.getThumbnail(user) + "')",
                  }}
                ></div>
              </div>
              <div className="message-content">
                <div className="message-content-header">
                  <span className="sender-name">{User.getFullName(user)}</span>
                  <span className="date">14/09 at 15h18</span>
                </div>
                <div className="content-parent">
                  <Twacode
                    className="content allow_selection"
                    onDoubleClick={(evt: any) => {
                      evt.preventDefault();
                      evt.stopPropagation();
                    }}
                    content={MessagesService.prepareContent(
                      this.props.message.content,
                      this.props.message.user_specific_content,
                    )}
                    id={this.props.message.front_id}
                    isApp={this.props.message.message_type == 1}
                    after={
                      this.props.message.edited &&
                      this.props.message.message_type == 0 && <div className="edited">(edited)</div>
                    }
                    onAction={undefined}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="thread-section compact">
            <div className="message">
              <div className="sender-space" />
              <div className="message-content">
                <a>Reply</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
