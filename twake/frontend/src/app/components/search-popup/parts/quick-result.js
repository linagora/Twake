import React from 'react';
import '../search-popup.scss';

import Emojione from 'components/emojione/emojione';
import Icon from 'components/icon/icon.js';
import User from 'components/user/user.js';

export default class QuickResult extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
        className={
          'searchQuickResult ' +
          (this.props.selected ? 'selected ' : '') +
          (!this.props.group && !this.props.workspace && 'no_workspace_and_group ')
        }
        onClick={this.props.onClick}
      >
        <div className="selectable">
          {(this.props.emoji || this.props.icon || this.props.users) && (
            <div className="icon">
              {this.props.emoji && <Emojione type={this.props.emoji} />}
              {this.props.icon && <Icon type={this.props.icon} className="icon" />}
              {this.props.users && (
                <div className="user_list">
                  {this.props.users.map(user => {
                    return (
                      <User
                        key={user.front_id}
                        user={user}
                        withStatus={this.props.users.length == 1}
                      />
                    );
                  })}
                  {this.props.users.length > 1 && (
                    <div className="group_count">{this.props.users.length}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="content">
            <div className="group_and_workspace">
              {(this.props.group || {}).name}
              {this.props.group && this.props.workspace && ' • '}
              {(this.props.workspace || {}).name}
              {this.props.workspaceSuffix}
            </div>
            <div className="text">
              <span>{this.props.text}</span>

              {this.props.locked && <Icon type="lock" />}
              {this.props.public && <Icon type="users-alt" />}
              {this.props.muted && <Icon type="bell-slash" />}
            </div>
          </div>

          <div className="more">
            <Icon type="arrow-right" className="right-arrow" />
          </div>
        </div>
      </div>
    );
  }
}
