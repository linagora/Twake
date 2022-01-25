import React from 'react';
import { ViewConfiguration } from '../../../features/router/services/app-view-service';
import { useTab } from '../../../state/recoil/hooks/useTabs';
import DriveContent from './drive-content';

type Props = {
  options: ViewConfiguration;
};

export default (props: Props) => {
  const tabId = props.options?.context?.tabId;
  const { tab, save } = useTab(tabId);

  return (
    <DriveContent
      options={props.options}
      tab={tab}
      saveTab={(configuration: any) => {
        save({ ...tab, configuration });
      }}
    />
  );
};
