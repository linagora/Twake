<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import './Channel.scss';

import Icon from 'components/Icon/Icon.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';

export default class ChannelDroppableZone extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    var pinned_channels = {};
    return (
      <DroppableZone
        className="channel_dropzone for_channel"
        types={['channel']}
        onDrop={this.props.onDrop}
      >
        {this.props.icon && <Icon type={this.props.icon} className="icon" />}
        {!this.props.icon && <div className="icon" />}
        <div className="text">{this.props.text}</div>
      </DroppableZone>
    );
  }
}
