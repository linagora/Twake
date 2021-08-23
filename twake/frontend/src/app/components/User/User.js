import React, { Component } from 'react';

import './User.scss';

import UserService from 'services/user/UserService';
import NotificationParameters from 'services/user/notification_parameters.js';
import ListenUsers from 'services/user/ListenUsers';

export default class User extends React.Component {
  constructor(props) {
    super();
  }
  componentWillMount() {
    ListenUsers.listenUser(this.props.user.id);
  }
  componentWillUnmount() {
    ListenUsers.cancelListenUser(this.props.user.id);
  }
  render() {
    var user = this.props.user;
    var notifications_disabled = false;
    if (user && NotificationParameters.hasNotificationsDisabled(user.notifications_preferences)) {
      notifications_disabled = true;
    }
    return (
      <div
        className={
          'user_head ' +
          (this.props.small ? 'small ' : '') +
          (this.props.withBorder === undefined || this.props.withBorder ? 'border ' : '') +
          (this.props.medium ? 'medium ' : '') +
          (this.props.big ? 'big ' : '')
        }
        style={{ backgroundImage: 'url(' + UserService.getThumbnail(user) + ')' }}
      >
        {this.props.withStatus && (
          <div
            className={
              'status ' +
              (!user.connected && !notifications_disabled ? 'grey ' : '') +
              (notifications_disabled ? 'red ' : '')
            }
          />
        )}
      </div>
    );
  }
}
