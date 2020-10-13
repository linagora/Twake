import React, { Component } from 'react';

import './CompanyHeader.scss';

import User from 'components/User/User.js';
import UserService from 'services/user/user.js';
import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione';

export default class CompanyHeader extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    var user = this.props.user || {};
    var notifications_disabled = this.props.notificationsDisabled;
    var status = this.props.status;
    return (
      <div className="current-company-header">
        <div
          ref={this.props.refDivUser}
          className="current-company"
          onClick={evt => this.props.onClickUser && this.props.onClickUser(evt)}
        >
          <div className="name">
            <div className="text">{this.props.companyName}</div>
            <div className="icon">
              <Icon type="angle-down" />
            </div>
          </div>

          <div className="user-info">
            <div
              className={
                'status ' +
                (!user.connected && !notifications_disabled ? 'grey ' : '') +
                (notifications_disabled ? 'red ' : '')
              }
            />

            {!!(user.status_icon || [])[0] && <Emojione type={user.status_icon[0]} />}

            <span className="text">{'@' + user.username}</span>
          </div>
        </div>

        <div className="notifications">
          <div
            ref={this.props.refDivBell}
            className={
              'bell ' +
              (notifications_disabled ? 'disabled ' : '') +
              (status == 'paused' && !notifications_disabled ? 'sleep ' : '')
            }
            onClick={evt => {
              evt.stopPropagation();
              evt.preventDefault();
              this.props.onClickBell && this.props.onClickBell(evt);
            }}
          >
            <Icon type={status == 'on' ? 'bell' : 'bell-slash'} className="bell-icon" />
          </div>
        </div>
      </div>
    );

    /*
    return (
      <div
        ref={this.props.refDiv}
        className={'current_user '}
        onClick={evt => this.props.onClickUser && this.props.onClickUser(evt)}
        style={this.props.style || {}}
      >
        <div className="image">
          <User user={user} big withStatus withBorder={false} />
        </div>
        <div className="content">
          <div className="name">
            <div className="text">{UserService.getFullName(user)}</div>
            <div className="icon">
              <Icon type="angle-down" />
            </div>
          </div>
          <div className="subname">
            <div className="icon">
              {user.status_icon && <Emojione type={user.status_icon[0]} />}
            </div>
            <div className="text">{'@' + user.username}</div>
            <div
              className={
                'bell ' +
                (notifications_disabled ? 'disabled ' : '') +
                (status == 'paused' && !notifications_disabled ? 'sleep ' : '')
              }
              onClick={evt => {
                evt.stopPropagation();
                evt.preventDefault();
                this.props.onClickBell && this.props.onClickBell(evt);
              }}
            >
              <Icon type={status == 'on' ? 'bell' : 'bell-slash'} className="bell-icon" />
            </div>
          </div>
        </div>
      </div>
    );
    */
  }
}
