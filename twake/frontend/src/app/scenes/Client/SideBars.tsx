import ChannelsBar from './ChannelsBar/ChannelsBar';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar';
import RouterServices from 'app/services/RouterService';
import React from 'react';
import { Layout } from 'antd';

export default () => {
  const { companyId, workspaceId } = RouterServices.useRouteState(({ companyId, workspaceId }) => {
    return { companyId, workspaceId };
  });

  return (
    <Layout style={{ height: '100%', backgroundColor: 'var(--secondary)' }}>
      <WorkspacesBar key={'workspacebar-' + companyId} />
      <ChannelsBar key={'channelbar-' + workspaceId} />
    </Layout>
  );
};
