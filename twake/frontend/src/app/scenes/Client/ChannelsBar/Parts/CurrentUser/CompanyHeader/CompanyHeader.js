import React from 'react';

import './CompanyHeader.scss';

import UserService from 'services/user/user.js';
import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione';
import NotificationDelay from '../Notifications/NotificationDelay';

export default class CompanyHeader extends React.Component {
  constructor() {
    super();
  }
  render() {
    var user = this.props.user || {};
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
            {!!(user.status_icon || [])[0] && <Emojione type={user.status_icon[0]} />}

            <span className="text">
              {UserService.getFullName(user)} ({user.email})
            </span>
          </div>
        </div>
        <div className="notifications">
          <NotificationDelay />
        </div>
      </div>
    );
  }
}
