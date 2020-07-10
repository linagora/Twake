<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import './elements.scss';
import UserService from 'services/user/user.js';

export default class User extends React.Component {
  render() {
    return (
      <div className={'user_bloc ' + (this.props.mini ? 'mini ' : '')}>
        <div
          className="userimage"
          style={{ backgroundImage: "url('" + UserService.getThumbnail(this.props.data) + "')" }}
        />
        {!this.props.mini && UserService.getFullName(this.props.data)}
      </div>
    );
  }
}
