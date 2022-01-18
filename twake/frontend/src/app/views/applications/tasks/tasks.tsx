import { ChannelResource } from 'app/models/Channel';
import React from 'react';
import { ViewConfiguration } from '../../../services/AppView/AppViewService';
import { useTab } from '../../../state/recoil/hooks/useTabs';
import TasksContent from './tasks-content';

type Props = {
  channel: ChannelResource;
  options: ViewConfiguration;
};

export default (props: Props) => {
  const tabId = props.options?.context?.tabId;
  const { tab, save } = useTab(tabId);

  return (
    <TasksContent
      options={props.options}
      tab={tab}
      channel={props.channel || {}}
      saveTab={(configuration: any) => {
        save({ ...tab, configuration });
      }}
    />
  );
};
