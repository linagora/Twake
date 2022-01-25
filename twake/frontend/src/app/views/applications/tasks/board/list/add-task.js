import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import Input from 'components/inputs/input.js';
import Button from 'components/buttons/button.js';
import OutsideClickHandler from 'react-outside-click-handler';

export default class AddTask extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      i18n: Languages,
      unselected: true,
    };
    Languages.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  newTask() {
    this.setState({ new_task_title: '' });
    if (!(this.state.new_task_title || '').trim()) {
      return;
    }

    var task = {
      title: this.state.new_task_title,
    };

    this.props.onSubmit(task);
  }
  render() {
    if (this.state.unselected) {
      return (
        <div
          className="add_task unselected"
          onClick={() => {
            this.setState({ unselected: false });
          }}
        >
          {Languages.t('scenes.apps.board.new_task', [], '+ New task')}
        </div>
      );
    }

    return (
      <OutsideClickHandler
        onOutsideClick={() => {
          this.setState({ unselected: true });
        }}
      >
        <div className="add_task">
          <Input
            autoFocus
            className="medium"
            placeholder={Languages.t('general.add', [], 'Add')}
            value={this.state.new_task_title}
            onChange={evt => {
              this.setState({ new_task_title: evt.target.value });
            }}
            onEnter={() => {
              this.newTask();
            }}
          />
          <Button
            className="small"
            value={Languages.t('general.add', [], 'Add')}
            onClick={() => {
              this.newTask();
            }}
          />
        </div>
      </OutsideClickHandler>
    );
  }
}
