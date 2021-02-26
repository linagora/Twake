import React, { FC } from 'react';
import RouterServices from 'app/services/RouterService';

import { Layout } from 'antd';
import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';

import './MainView.scss';
import NoApp from './NoApp';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';

const MainView: FC = () => {
  const { companyId, workspaceId, channelId } = RouterServices.useRouteState(
    ({ companyId, workspaceId, channelId }) => {
      return { companyId, workspaceId, channelId };
    },
  );

  const ready =
    ChannelsBarService.useWatcher(() => {
      return (
        ChannelsBarService.ready[companyId + '+' + workspaceId] &&
        ChannelsBarService.ready[companyId + '+' + workspaceId + '+applications'] &&
        ChannelsBarService.ready[companyId + '+direct']
      );
    }) &&
    !!companyId &&
    !!workspaceId;

  if (ready && !channelId) {
    ChannelsBarService.autoSelectChannel(companyId || '', workspaceId || '');
  }

  return (
    <Layout className="global-view-layout">
      {!!channelId && ready && (
        <>
          <MainHeader />
          <MainContent />
        </>
      )}
      {!channelId && ready && <NoApp />}
    </Layout>
  );
};

export default MainView;
