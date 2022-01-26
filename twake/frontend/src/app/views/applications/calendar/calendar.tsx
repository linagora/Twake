import React from 'react';
import { ViewConfiguration } from '../../../features/router/services/app-view-service';
import { useTab } from '../../../features/tabs/hooks/use-tabs';
import CalendarContent from './calendar-content';

type Props = {
  options: ViewConfiguration;
};

export default (props: Props) => {
  const tabId = props.options?.context?.tabId;
  const { tab, save } = useTab(tabId);

  return (
    <CalendarContent
      options={props.options}
      tab={tab}
      saveTab={(configuration: any) => {
        save({ ...tab, configuration });
      }}
    />
  );
};
