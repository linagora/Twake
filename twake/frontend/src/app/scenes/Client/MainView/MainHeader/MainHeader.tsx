import React, { FC } from 'react';
import { Layout, Divider } from 'antd';
import ChannelBar from './ChannelHeader/ChannelHeader';
import ChannelsService from 'app/services/channels/ChannelsService';
import ApplicationBar from './ApplicationHeader/ApplicationHeader';

type PropsType = {
  classname?: string;
  channelId: string;
};

const MainHeader: FC<PropsType> = props => {
  const channelType = ChannelsService.useWatcher(() => ChannelsService.getCurrentChannelType());
  const channelCollection = ChannelsService.getCurrentChannelCollection();
  if (!channelCollection) {
    return <></>;
  }

  return (
    <Layout.Header className={props.classname}>
      {channelType === 'channel' && <ChannelBar channelId={props.channelId} />}
      {channelType === 'application' && <ApplicationBar channelId={props.channelId} />}
      <Divider />
    </Layout.Header>
  );
};

export default MainHeader;
