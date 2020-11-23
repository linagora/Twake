import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';
import CurrentUser from './CurrentUser/CurrentUser.js';
import ChannelsApps from './ChannelsApps/ChannelsApps';
import { Workspace } from './Workspace/workspace';
import { ChannelsUser } from './ChannelsUser/ChannelsUser';
import Tutorial from './Tutorial.js';
import Footer from './Footer.js';
import RouterServices from 'services/RouterServices';
import './ChannelsBar.scss';

export default () => {
  const { companyId, workspaceId } = RouterServices.useStateFromRoute();

  return (
    <Layout.Sider theme="light" width={220} className="channels_view fade_in">
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
