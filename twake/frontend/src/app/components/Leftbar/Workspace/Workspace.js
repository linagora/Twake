<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import './Workspace.scss';

export default class Workspace extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    var workspace = this.props.workspace || {};
    return (
      <div
        className={
          'workspace ' +
          (this.props.selected ? 'is_selected ' : '') +
          (this.props.notifications > 0 ? 'has_notifications ' : '')
        }
        onClick={this.props.onClick}
      >
        <div
          className={'image ' + (workspace.logo ? 'has_image ' : '')}
          style={{ backgroundImage: "url('" + window.addApiUrlIfNeeded(workspace.logo) + "')" }}
        >
          {((workspace.mininame || workspace.name || '') + '-')[0].toUpperCase()}

          {this.props.notifications > 0 && <div className="notification_dot" />}
        </div>
        <div className="name">{workspace.mininame || workspace.name}</div>
      </div>
    );
  }
}
