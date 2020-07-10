<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import UserService from 'services/user/user.js';
import Collections from 'services/Collections/Collections.js';

export default class User extends React.Component {
  componentWillMount() {
    if (this.props.id) {
      Collections.get('users').addListener(this);
    }
  }
  componentWillUnmount() {
    Collections.get('users').removeListener(this);
  }
  render() {
    if (!this.props.id) {
      return <div className="user_twacode unknown">@{this.props.username}</div>;
    }
    var id = this.props.id;
    var user = Collections.get('users').find(id);
    if (user) {
      return (
        <div className="user_twacode">
          <div
            className="userimage"
            style={{ backgroundImage: "url('" + UserService.getThumbnail(user) + "')" }}
          />
          {UserService.getFullName(user)}
        </div>
      );
    } else {
      UserService.asyncGet(id);
      return <div className="user_twacode unknown">@{this.props.username}</div>;
    }
  }
}
