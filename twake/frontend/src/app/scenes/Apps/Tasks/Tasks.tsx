import React from 'react';
import { ViewConfiguration } from '../../../services/AppView/AppViewService';
import { useTab } from '../../../state/recoil/hooks/useTabs';
import TasksContent from './TasksContent';

type Props = {
  options: ViewConfiguration;
};

export default (props: Props) => {
  const tabId = props.options?.context?.tabId;
  const { tab, save } = useTab(tabId);

  return (
    <TasksContent
      options={props.options}
      tab={tab}
      saveTab={(configuration: any) => {
        save({ ...tab, configuration });
      }}
    />
  );
};
