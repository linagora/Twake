import React, { FC } from 'react';
import Messages from 'app/views/applications/messages';
import Drive from 'app/views/applications/drive';
import Calendar from 'app/views/applications/calendar/calendar-content';
import Tasks from 'app/views/applications/tasks/tasks';
import NoApp from '../NoApp';
import AppViewService from 'app/features/router/services/app-view-service';
import { useChannel } from 'app/features/channels/hooks/use-channel';

type PropsType = {
  viewService: AppViewService;
  id: string;
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

  const { channel } = useChannel(props.id);

  const app = props.viewService.getConfiguration().app;

  switch (app?.identity?.code) {
    case 'twake_drive':
      return <Drive />;
    case 'twake_calendar':
      return <Calendar options={configuration} />;
    case 'twake_tasks':
      return <Tasks channel={channel} options={configuration} />;
    case 'messages':
      return <Drive />;
    default:
      return <NoApp />;
  }
};
export default AppView;
