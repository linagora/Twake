import React from 'react';
import Messages from 'scenes/Apps/Messages/Messages';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Calendar from 'scenes/Apps/Calendar/Calendar.js';
import Tasks from 'scenes/Apps/Tasks/Tasks.js';

type PropsType = {
  loading: boolean;
  app: any;
  current_channel_tab: any;
  current_channel: any;
  options: any;
  noapp: any;
};

export default (props: PropsType) => {
  let found = false;
  if (!props.loading && (props.app || {}).simple_name == 'twake_drive' && (found = true)) {
    return (
      <Drive
        key={props.current_channel.id + '_' + (props.current_channel_tab || {}).id}
        channel={props.current_channel}
        tab={props.current_channel_tab}
        options={props.options}
      />
    );
  }
  if (!props.loading && (props.app || {}).simple_name == 'twake_calendar' && (found = true)) {
    return (
      <Calendar
        key={props.current_channel.id + '_' + (props.current_channel_tab || {}).id}
        channel={props.current_channel}
        tab={props.current_channel_tab}
        options={props.options}
      />
    );
  }
  if (!props.loading && (props.app || {}).simple_name == 'twake_tasks' && (found = true)) {
    return (
      <Tasks
        key={props.current_channel.id + '_' + (props.current_channel_tab || {}).id}
        channel={props.current_channel}
        tab={props.current_channel_tab}
        options={props.options}
      />
    );
  }
  if (!props.loading && props.app == 'messages' && (found = true)) {
    return (
      <Messages
        key={props.current_channel.id}
        channel={props.current_channel}
        options={props.options}
      />
    );
  }
  if (!found && !props.loading) {
    return props.noapp;
  }
  return '';
};
