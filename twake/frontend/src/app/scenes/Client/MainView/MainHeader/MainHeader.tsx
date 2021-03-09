import React, { FC } from 'react';
import { Layout, Divider } from 'antd';
import ChannelBar from './ChannelHeader/ChannelHeader';
import MainViewService from 'app/services/AppView/MainViewService';
import ApplicationBar from './ApplicationHeader/ApplicationHeader';
import RouterServices from 'app/services/RouterService';

const MainHeader: FC<{}> = () => {
  const { channelId } = RouterServices.getStateFromRoute();
  const channelType = MainViewService.useWatcher(() => MainViewService.getViewType());
  const channelCollection = MainViewService.getViewCollection();
  if (!channelCollection) {
    return <></>;
  }

  return (
    <Layout.Header className={'global-view-header'}>
      {channelType === 'channel' && <ChannelBar key={channelId} />}
      {channelType === 'application' && <ApplicationBar key={channelId} />}
      <Divider />
    </Layout.Header>
  );
};

export default MainHeader;
