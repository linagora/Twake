import React, { FC, useState, useEffect } from 'react';
import RouterServices from 'app/services/RouterService';
import Collections, { Collection, Resource } from 'services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';

import { Layout } from 'antd';
import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';

import './MainView.scss';

const MainView: FC = () => {
  const { companyId, workspaceId, channelId } = RouterServices.useStateFromRoute();

  return (
    <Layout className="main-view-layout">
      {!!companyId && !!workspaceId && !!channelId && (
        <>
          <MainHeader />
          <MainContent />
        </>
      )}
    </Layout>
  );
};

export default MainView;
