import React, { FC } from 'react';
import { Layout, Divider } from 'antd';
import ChannelBar from './ChannelBar/ChannelBar';

type PropsType = {
  classname?: string;
  channelName?: string;
  channelIcon?: any;
  channelId: string;
  channelDescription?: any;
};

const MainHeader: FC<PropsType> = props => {
  return (
    <Layout.Header className={props.classname}>
      <ChannelBar
        channelId={props.channelId}
        channelIcon={props.channelIcon}
        channelName={props.channelName || ''}
      />
      <Divider />
    </Layout.Header>
  );
};

export default MainHeader;
