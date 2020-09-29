import React, { Component } from 'react';
import Messages from 'scenes/Apps/Messages/Messages';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Calendar from 'scenes/Apps/Calendar/Calendar.js';
import Tasks from 'scenes/Apps/Tasks/Tasks.js';
import workspaceService from 'services/workspaces/workspaces.js';
import userService from 'services/user/user.js';
import CurrentUser from 'services/user/current_user.js';

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
    if (!this.props.loading && (this.props.app || {}).display.channel_tab && (found = true)) {
      const userId = userService.getCurrentUserId();
      const groupId = workspaceService.currentGroupId;
      const workspaceId = workspaceService.currentWorkspaceId;
      let url = this.props.app.display.channel_tab.iframe;
      url +=
        (url.indexOf(this.props.app.display.channel_tab.iframe) ? '&' : '?') +
        `user_id=${userId}&group_id=${groupId}&workspace_id=${workspaceId}&channel_id=${this.props.current_channel.id}&connection_id=${CurrentUser.unique_connection_id}`;
      return (
        <iframe
          id="quickLinksFrame"
          title="QuickLinks"
          width="100%"
          height="100%"
          frameBorder="0"
          src={url}
        />
      );
    }

    if (!found && !this.props.loading) {
      return this.props.noapp;
    }
    return '';
  }
}
