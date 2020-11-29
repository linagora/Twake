import React, { FC } from 'react';
import { Layout, Divider } from 'antd';
import ChannelBar from './ChannelHeader/ChannelHeader';
import ChannelsService from 'app/services/channels/ChannelsService';
import ApplicationBar from './ApplicationHeader/ApplicationHeader';
import RouterService from 'app/services/RouterService';

const MainHeader: FC<{}> = () => {
  const { channelId } = RouterService.useStateFromRoute();
  const channelType = ChannelsService.useWatcher(() => ChannelsService.getCurrentChannelType());
  const channelCollection = ChannelsService.getCurrentChannelCollection();
  if (!channelCollection) {
    return <></>;
  }

  return (
    <Layout.Header className={'main-view-header'}>
      {channelType === 'channel' && <ChannelBar key={channelId} />}
      {channelType === 'application' && <ApplicationBar key={channelId} />}
      <Divider />
    </Layout.Header>
  );
};

export default MainHeader;
