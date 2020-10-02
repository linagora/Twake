import React, { Component } from 'react';

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
        onClick={this.props.editable && this.props.onClick}
      >
        <div className="text">{this.props.text}</div>
        {this.props.sub && this.props.editable && (
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
