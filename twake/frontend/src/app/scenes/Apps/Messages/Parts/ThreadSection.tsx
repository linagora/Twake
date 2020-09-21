import React, { Component } from 'react';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import { getSender } from 'app/services/Apps/Messages/MessagesUtils';
import './Threads.scss';

type Props = {
  message?: Message;
  compact?: boolean;
  gradient?: boolean;
  small?: boolean;
  head?: boolean;
  alinea?: boolean;
  children?: any;
  noSenderSpace?: boolean;
  className?: string;
  delayRender?: boolean;
};

export default class ThreadSection extends Component<Props> {
  render() {
    let senderData: any = getSender(this.props.message);
    if (senderData.type === 'user') {
      Collections.get('users').addListener(this);
      Collections.get('users').listenOnly(this, [senderData.id]);
    }
    if (!senderData.type || senderData.type === 'unknown') {
      senderData = false;
    }

    return (
      <div
        className={
          'thread-section ' +
          (this.props.compact ? 'compact ' : '') +
          (this.props.gradient ? 'gradient ' : '') +
          (this.props.small ? 'small-section ' : '') +
          (this.props.alinea ? 'alinea ' : '') +
          (this.props.head ? 'head-section ' : '') +
          (this.props.message?.sender && this.props.message.pinned ? 'pinned-section ' : '') +
          (this.props.className ? this.props.className + ' ' : '')
        }
      >
        <div className="message">
          {!this.props.noSenderSpace && (
            <div className="sender-space">
              {senderData && (
                <div
                  className={'sender-head'}
                  style={{
                    backgroundImage: "url('" + User.getThumbnail(senderData) + "')",
                  }}
                ></div>
              )}
            </div>
          )}
          {!this.props.delayRender && this.props.children}
        </div>
      </div>
    );
  }
}
