import React, { Component } from 'react';
import Icon from 'app/components/icon/icon.jsx';
import './Task.scss';

export default class TaskElement extends React.Component {
  constructor() {
    super();

    this.state = {};
  }
  render() {
    var task = this.props.task;

    if (!task) {
      return '';
    }
    return (
      <div
        className={'task noselect ' + (this.props.selected ? 'selected ' : '')}
        onClick={this.props.onClick}
      >
        {task.name}

        {task.like != 0 && (
          <div style={{ display: 'inline-block' }} className="addon_icon">
            <Icon type="like-o" /> {task.like}
          </div>
        )}
        {task.weight > 1 && (
          <div style={{ display: 'inline-block' }} className="addon_icon">
            <Icon type="hourglass" /> {task.weight}
          </div>
        )}
        {task.to > 0 && (
          <div style={{ display: 'inline-block' }} className="addon_icon">
            <Icon type="clock-circle" />
          </div>
        )}
        {task.from > 0 && (
          <div style={{ display: 'inline-block' }} className="addon_icon">
            <Icon type="clock-circle-o" />
          </div>
        )}
        {task.description && (
          <div style={{ display: 'inline-block' }} className="addon_icon">
            <Icon type="bars" />
          </div>
        )}
        {this.state.boardService && task.list != this.state.boardService.doneId && (
          <div
            className="isDone"
            onClick={() =>
              this.state.boardService.moveTask(task.id, this.state.boardService.doneId, 0)
            }
          >
            <Icon type="check" theme="outlined" />
          </div>
        )}
      </div>
    );
  }
}
