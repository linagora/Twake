import React, { FC } from 'react';
import RouterServices from 'app/services/RouterService';

import { Layout } from 'antd';
import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';

import './MainView.scss';
import NoApp from './NoApp';

const MainView: FC = () => {
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();

  return (
    <Layout className="global-view-layout">
      {!!companyId && !!workspaceId && !!channelId && (
        <>
          <MainHeader />
          <MainContent />
        </>
      )}
      {!!companyId && !!workspaceId && !channelId && <NoApp />}
    </Layout>
  );
};

export default MainView;
