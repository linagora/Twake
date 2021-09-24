// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Layout } from 'antd';

import ChannelsBar from './ChannelsBar/ChannelsBar';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar';
import RouterServices from 'app/services/RouterService';

export default () => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();

  return (
    <Layout style={{ height: '100%', backgroundColor: 'var(--secondary)' }}>
      <WorkspacesBar key={`workspacebar-${companyId}`} />
      <ChannelsBar key={`channelbar-${workspaceId}`} />
    </Layout>
  );
};
