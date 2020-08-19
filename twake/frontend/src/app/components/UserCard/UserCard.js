import React, { Component } from 'react';

import Button from 'components/Buttons/Button.js';
import Languages from 'services/languages/languages.js';
import User from 'components/User/User.js';
import UserServices from 'services/user/user.js';
import './User-Card.scss';

export default class UserCard extends Component {
  render() {
    return (
      <div className="user-card allow_selection">
        <div className="content-popup small-bottom-margin">
          <div className="avatar">
            <User withStatus big user={this.props.user} />
          </div>
          <div className="texts">
            <div className="text-ellipsis title">{UserServices.getFullName(this.props.user)}</div>
            <div className="text-ellipsis">{'@' + (this.props.user || {}).username}</div>
          </div>
        </div>
        <div className="footer">
          <Button
            type="submit"
            value={Languages.t('general.send', 'Save')}
            onClick={this.props.onClick}
          />
        </div>
      </div>
    );
  }
}
