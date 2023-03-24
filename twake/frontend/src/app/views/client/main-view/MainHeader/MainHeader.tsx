import React, { FC } from 'react';
import { Layout } from 'antd';
import ChannelBar from './ChannelHeader/ChannelHeader';
import MainViewService from 'app/features/router/services/main-view-service';
import ApplicationBar from './ApplicationHeader/ApplicationHeader';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';

const MainHeader: FC<unknown> = () => {
  const channelId = useRouterChannel();
  const channelType = MainViewService.useWatcher(() => MainViewService.getViewType());

  return (
    <Layout.Header className={'global-view-header'}>
      {channelType === 'channel' && <ChannelBar key={channelId} />}
      {channelType === 'application' && <ApplicationBar key={channelId} />}
    </Layout.Header>
  );
};

export default MainHeader;
