// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import classNames from 'classnames';
import { Layout } from 'antd';

import ChannelsBar, { LoadingChannels } from './ChannelsBar/ChannelsBar';
import WorkspacesBar, { LoadingWorkspace } from './WorkspacesBar/WorkspacesBar';

import "./WorkspacesBar/WorkspacesBar.scss"




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
    <Layout>
      <LoadingWorkspace />
      <Layout.Sider theme="light" width={220} className={classNames('channels_view', {loading: true, loading_render: true, })} style={{ height: '100%' }}>
        <LoadingChannels />
      </Layout.Sider> 
    </Layout>

  );
};