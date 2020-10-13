import React, { Component } from 'react';
import User from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';
import 'moment-timezone';
import { Message } from 'app/services/Apps/Messages/MessagesListServerUtils';
import { getSender } from 'app/services/Apps/Messages/MessagesUtils';
import Draggable from 'components/Draggable/Draggable.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Icon from 'components/Icon/Icon.js';
import './Threads.scss';

type Props = {
  message?: Message;
  compact?: boolean;
  onClick?: (value: any) => any | void;
  gradient?: boolean;
  small?: boolean;
  head?: boolean;
  alinea?: boolean;
  children?: any;
  noSenderSpace?: boolean;
  className?: string;
  delayRender?: boolean;
  canDrag?: boolean;
};

export default class ThreadSection extends Component<Props> {
  node: any;

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
      <Draggable
        refDraggable={(node: any) => {
          this.node = node;
        }}
        dragHandler="js-drag-handler-message"
        data={{ type: 'message', data: this.props.message }}
        parentClassOnDrag="dragged"
        onDragStart={(evt: any) => {}}
        minMove={10}
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
        onClick={this.props.onClick}
        deactivated={!this.props.canDrag}
      >
        <div className="message">
          {!this.props.noSenderSpace && (
            <div className="sender-space">
              {senderData && senderData.type !== 'app' && (
                <div
                  className={'sender-head'}
                  style={{
                    backgroundImage: "url('" + User.getThumbnail(senderData) + "')",
                  }}
                ></div>
              )}
              {senderData && senderData.type === 'app' && (
                <Icon
                  className="no-margin-left"
                  style={{ fontSize: this.props.small ? '16px' : '24px' }}
                  type={
                    senderData.application
                      ? WorkspacesApps.getAppIcon(senderData.application)
                      : 'puzzle-piece' || 'puzzle-piece'
                  }
                />
              )}
            </div>
          )}
          {!this.props.delayRender && this.props.children}
        </div>
      </Draggable>
    );
  }
}
