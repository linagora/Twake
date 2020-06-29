import React, { Component } from 'react';

import Notifications from 'services/user/notifications.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import './Notifications.scss';

export default class NotificationsBodyLayer extends React.Component {
  constructor(props) {
    super();
    this.state = {
      notifications: Notifications,
    };
    Notifications.addListener(this);
    this.timeout = '';
  }
  componentWillUnmount() {
    Notifications.removeListener(this);
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.notifications && nextState.notifications.last_notification) {
      if (nextState.notifications.last_notification.id == this.last_id) {
        return false;
      }

      this.last_id = nextState.notifications.last_notification.id;
    } else {
      this.last_id = null;
    }

    if (this.last_id) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.close();
      }, 7000);
    }

    return true;
  }
  close() {
    this.state.notifications.last_notification = null;
    this.state.notifications.notify();
  }
  render() {
    var n = this.state.notifications.last_notification;
    if (n) {
      return (
        <div>
          {(() => {
            return (
              <div
                key={n.id}
                className="pushed_notification"
                onClick={() => {
                  this.close();
                  if (this.state.notifications.last_notification_callback) {
                    this.state.notifications.last_notification_callback();
                  }
                }}
              >
                <div className="title">
                  {PseudoMarkdownCompiler.compileToSimpleHTML(
                    PseudoMarkdownCompiler.compileToJSON(n.title),
                  )}
                </div>
                <div className="text markdown">
                  {PseudoMarkdownCompiler.compileToSimpleHTML(
                    PseudoMarkdownCompiler.compileToJSON(
                      (n.text || '').substr(0, 120) + ((n.text || '').length > 120 ? '...' : ''),
                    ),
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      );
    }
    return <div></div>;
  }
}
