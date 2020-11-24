import React, { FC } from 'react';
import { Layout, Divider } from 'antd';
import ChannelBar from './ChannelBar/ChannelBar';

type PropsType = {
  classname?: string;
  channelId: string;
};

const MainHeader: FC<PropsType> = props => {
  return (
    <Layout.Header className={props.classname}>
      <ChannelBar channelId={props.channelId} />
      <Divider />
    </Layout.Header>
  );
};

export default MainHeader;
