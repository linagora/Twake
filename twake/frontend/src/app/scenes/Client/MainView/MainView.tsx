import React, { FC, useState, useEffect } from 'react';
import RouterServices from 'app/services/RouterService';
import Collections, { Collection, Resource } from 'services/CollectionsReact/Collections';
import { ChannelType, ChannelResource } from 'app/models/Channel';
import Languages from 'services/languages/languages.js';

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
      {!!companyId && !!workspaceId && !channelId && (
        <div className="main_view">
          <div className="no_channel_text">
            {Languages.t(
              'scenes.app.mainview.instruction_current_tab',
              [],
              'Commencez par sélectionner une chaîne sur votre gauche.',
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MainView;
