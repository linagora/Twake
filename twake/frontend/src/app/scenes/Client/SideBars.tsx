// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Layout } from 'antd';

import ChannelsBar, { LoadingChannelBar } from './ChannelsBar/ChannelsBar';
import WorkspacesBar, { LoadingWorkspaceBar } from './WorkspacesBar/WorkspacesBar';

import './WorkspacesBar/WorkspacesBar.scss';
import { useWorkspaceLoader } from 'app/state/recoil/hooks/useWorkspaces';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import useRouterWorkspace from 'app/state/recoil/hooks/useRouterWorkspace';

export default () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const { loading } = useWorkspaceLoader(companyId);

  if (loading) {
    return <LoadingSidebar />;
  }

  return (
    <Layout style={{ height: '100%', backgroundColor: 'var(--secondary)' }}>
      <WorkspacesBar />
      {!!workspaceId && <ChannelsBar />}
      {!workspaceId && <LoadingChannelBar />}
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
