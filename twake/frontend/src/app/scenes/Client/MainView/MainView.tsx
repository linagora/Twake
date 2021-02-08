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

  const ready = ChannelsBarService.useWatcher(() => {
    return (
      ChannelsBarService.ready[companyId + '+' + workspaceId] &&
      ChannelsBarService.ready[companyId + '+' + workspaceId + '+applications'] &&
      ChannelsBarService.ready[companyId + '+direct']
    );
  });

  return (
    <Layout className="global-view-layout">
      {!!companyId && !!workspaceId && !!channelId && ready && (
        <>
          <MainHeader />
          <MainContent />
        </>
      )}
      {!!companyId && !!workspaceId && !channelId && ready && <NoApp />}
    </Layout>
  );
};

export default MainView;
