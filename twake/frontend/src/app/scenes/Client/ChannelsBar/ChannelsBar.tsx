import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';
import CurrentUser from './Parts/CurrentUser/CurrentUser.js';
import ChannelsApps from './ChannelsApps/ChannelsApps';
import { Workspace } from './Workspace/workspace';
import { ChannelsUser } from './ChannelsUser/ChannelsUser';
import Tutorial from './Parts/Tutorial.js';
import Footer from './Parts/Footer.js';
import RouterServices from 'app/services/RouterService';
import './ChannelsBar.scss';

export default () => {
  const { companyId, workspaceId } = RouterServices.useStateFromRoute();

  return (
    <Layout.Sider theme="light" width={220} className="channels_view">
      <CurrentUser />
      {!!companyId && !!workspaceId && (
        <PerfectScrollbar component="div">
          <ChannelsApps key={workspaceId} />
          <Workspace key={'workspace_chans_' + workspaceId} />
          <ChannelsUser key={companyId} />
        </PerfectScrollbar>
      )}
      <Tutorial />
      <Footer />
    </Layout.Sider>
  );
};
