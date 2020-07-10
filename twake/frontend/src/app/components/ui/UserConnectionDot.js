<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import './elements.scss';

export default class UserConnectionDot extends React.Component {
  render() {
    if (this.props.connected && !this.props.notificationsDisabled) {
      return <div className="connexion_dot green" />;
    } else if (!this.props.connected && !this.props.notificationsDisabled) {
      return <div className="connexion_dot grey" />;
    } else {
      return <div className="connexion_dot red" />;
    }
  }
}
