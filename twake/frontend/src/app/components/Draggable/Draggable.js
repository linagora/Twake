import React, { Component } from 'react';

import DraggableManager from './DraggableManager.js';
import './Draggable.scss';

export default class Draggable extends React.Component {
  constructor(props) {
    super();
    this.state = {};
  }
  render() {
    return (
      <div
        className={
          (this.props.deactivated ? '' : 'draggable ') +
          this.props.className +
          ' ' +
          (this.state.hide_original ? 'dragging_opacity ' : '')
        }
        ref={node => {
          this.node = node;
          if (this.props.refDraggable) {
            this.props.refDraggable(node);
          }
        }}
        onClick={this.props.onClick}
        onMouseDown={evt => {
          !this.props.deactivated && DraggableManager.start(evt, this.node, this);
        }}
        onMouseUp={evt => {
          !this.props.deactivated && DraggableManager.end(evt, this.node, this);
        }}
        onMouseOver={this.props.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        onDoubleClick={this.props.onDoubleClick}
      >
        {this.props.children}
      </div>
    );
  }
}
