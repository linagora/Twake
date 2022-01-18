// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { Layout } from 'antd';

import ChannelsBar, { LoadingChannelBar } from './channels-bar/ChannelsBar';
import WorkspacesBar, { LoadingWorkspaceBar } from './workspaces-bar';

import { useWorkspaceLoader } from 'app/state/recoil/hooks/useWorkspaces';
import useRouterCompany from 'app/state/recoil/hooks/router/useRouterCompany';
import useRouterWorkspace from 'app/state/recoil/hooks/router/useRouterWorkspace';
import { useCurrentCompanyRealtime } from '../../state/recoil/hooks/useCompanies';

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
