// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Layout } from 'antd';

import ChannelsBar, { LoadingChannelBar } from './channels-bar/ChannelsBar';
import WorkspacesBar, { LoadingWorkspaceBar } from './workspaces-bar';

import { useWorkspaceLoader } from 'app/features/workspaces/hooks/use-workspaces';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useCurrentCompanyRealtime } from '../../features/companies/hooks/use-companies';

import './workspaces-bar/styles.scss';

export default () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const { loading } = useWorkspaceLoader(companyId);
  useCurrentCompanyRealtime();

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
