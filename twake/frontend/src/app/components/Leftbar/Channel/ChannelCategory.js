<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import './Channel.scss';

import Icon from 'components/Icon/Icon.js';

export default class ChannelCategory extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    return (
      <div
        className={'channel_category ' + (this.props.sub ? 'sub ' : '')}
        style={this.props.style || {}}
        onClick={this.props.onClick}
      >
        <div className="text">{this.props.text}</div>
        {this.props.sub && (
          <div className="edit">
            <Icon type="edit-alt" />
          </div>
        )}
        {this.props.onAdd && (
          <div ref={this.props.refAdd} className="add" onClick={this.props.onAdd}>
            <Icon type="plus-circle" />
          </div>
        )}
      </div>
    );
  }
}
