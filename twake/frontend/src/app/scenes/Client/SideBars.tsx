// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Layout } from 'antd';

import ChannelsBar, { LoadingChannelBar } from './ChannelsBar/ChannelsBar';
import WorkspacesBar, { LoadingWorkspaceBar } from './WorkspacesBar/WorkspacesBar';

import './WorkspacesBar/WorkspacesBar.scss';

export default () => {
  return (
    <Layout style={{ height: '100%', backgroundColor: 'var(--secondary)' }}>
      <WorkspacesBar />
      <ChannelsBar />
    </Layout>
  );
};

export const LoadingSidebar = () => {
  return (
    <Layout style={{ height: '100%' }}>
      <LoadingWorkspaceBar />
      <LoadingChannelBar />
    </Layout>
  );
};
