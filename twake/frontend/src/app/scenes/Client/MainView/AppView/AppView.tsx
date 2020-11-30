import React, { FC } from 'react';
import Messages from 'scenes/Apps/Messages/Messages';
import Drive from 'scenes/Apps/Drive/Drive.js';
import Calendar from 'scenes/Apps/Calendar/Calendar.js';
import Tasks from 'scenes/Apps/Tasks/Tasks.js';
import NoApp from '../NoApp';
import { ViewConfiguration } from 'app/services/AppView/AppViewService';

type PropsType = {
  app: any;
  id: string;
  current_channel_tab?: any;
  current_channel?: any;
  configuration: ViewConfiguration;
};

const AppView: FC<PropsType> = props => {
  const channelCollection = props.configuration.collection;
  let channel = null;
  let channel_tab = null;
  if (props.app === 'messages') {
    channel = channelCollection.useWatcher({ id: props.id })[0];
  } else {
    channel = channelCollection.find(props.id);
  }

  if (channel) {
    if ((props.app || {}).simple_name == 'twake_drive') {
      return <Drive channel={channel} tab={channel_tab} options={props.configuration} />;
    }
    if ((props.app || {}).simple_name == 'twake_calendar') {
      return <Calendar channel={channel} tab={channel_tab} options={props.configuration} />;
    }
    if ((props.app || {}).simple_name == 'twake_tasks') {
      return <Tasks channel={channel} tab={channel_tab} options={props.configuration} />;
    }
    if (props.app == 'messages') {
      return <Messages channel={channel} options={props.configuration} />;
    }

    return <NoApp />;
  }
  return <></>;
};
export default AppView;
