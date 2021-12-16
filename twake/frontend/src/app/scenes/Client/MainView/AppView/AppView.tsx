import React, { FC } from 'react';
import Messages from 'app/scenes/Apps/Messages';
import Drive from 'app/scenes/Apps/Drive/Drive';
import Calendar from 'app/scenes/Apps/Calendar/CalendarContent';
import Tasks from 'app/scenes/Apps/Tasks/Tasks';
import NoApp from '../NoApp';
import AppViewService from 'app/services/AppView/AppViewService';

type PropsType = {
  viewService: AppViewService;
  id: string;
  current_channelTab?: any;
  current_channel?: any;
};

const AppView: FC<PropsType> = props => {
  //Listen context and app_id changes
  props.viewService.useWatcher(() => {
    return [
      props.viewService.getConfiguration().app?.id,
      props.viewService.getConfiguration().context,
    ];
  });

  const configuration = props.viewService.getConfiguration();

  const channelCollection = configuration.collection;
  let channel = null;
  if (channelCollection) {
    if (channelCollection?.findOne) {
      channel = channelCollection.findOne({ id: props.id }, { withoutBackend: true });
    }
  }

  const app = props.viewService.getConfiguration().app;

  switch (app?.identity?.code) {
    case 'twake_drive':
      return <Drive options={configuration} />;
    case 'twake_calendar':
      return <Calendar options={configuration} />;
    case 'twake_tasks':
      return <Tasks options={configuration} />;
    case 'messages':
      return <Messages channel={channel} options={configuration} />;
    default:
      return <NoApp />;
  }
};
export default AppView;
