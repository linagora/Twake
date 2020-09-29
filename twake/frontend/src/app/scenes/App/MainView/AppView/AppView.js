import React, { Component } from 'react';
import Messages from 'scenes/Apps/Messages/Messages';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Calendar from 'scenes/Apps/Calendar/Calendar.js';
import Tasks from 'scenes/Apps/Tasks/Tasks.js';

export default class AppView extends Component {
  constructor() {
    super();
  }
  render() {
    let found = false;
    if (
      !this.props.loading &&
      (this.props.app || {}).simple_name == 'twake_drive' &&
      (found = true)
    ) {
      return (
        <Drive
          key={this.props.current_channel.id + '_' + (this.props.current_channel_tab || {}).id}
          channel={this.props.current_channel}
          tab={this.props.current_channel_tab}
          options={this.props.options}
        />
      );
    }
    if (
      !this.props.loading &&
      (this.props.app || {}).simple_name == 'twake_calendar' &&
      (found = true)
    ) {
      return (
        <Calendar
          key={this.props.current_channel.id + '_' + (this.props.current_channel_tab || {}).id}
          channel={this.props.current_channel}
          tab={this.props.current_channel_tab}
          options={this.props.options}
        />
      );
    }
    if (
      !this.props.loading &&
      (this.props.app || {}).simple_name == 'twake_tasks' &&
      (found = true)
    ) {
      return (
        <Tasks
          key={this.props.current_channel.id + '_' + (this.props.current_channel_tab || {}).id}
          channel={this.props.current_channel}
          tab={this.props.current_channel_tab}
          options={this.props.options}
        />
      );
    }
    if (!this.props.loading && this.props.app == 'messages' && (found = true)) {
      return (
        <Messages
          key={this.props.current_channel.id}
          channel={this.props.current_channel}
          options={this.props.options}
        />
      );
    }
    if (!found && !this.props.loading) {
      return this.props.noapp;
    }
    return '';
  }
}
