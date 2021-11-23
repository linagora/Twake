// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Layout } from 'antd';

import ChannelsBar, { LoadingChannels } from './ChannelsBar/ChannelsBar';
import WorkspacesBar, { LoadingWorkspace } from './WorkspacesBar/WorkspacesBar';

import './WorkspacesBar/WorkspacesBar.scss';

export default () => {
  return (
    <Layout style={{ height: '100%', backgroundColor: 'var(--secondary)' }}>
      <WorkspacesBar key="workspacebar" />
      <ChannelsBar key="channelbar" />
    </Layout>
  );
};

export const LoadingSidebar = () => {
  return (
    <Layout style={{ height: '100%' }}>
      <LoadingWorkspace />
      <LoadingChannels />
    </Layout>
  );
};
