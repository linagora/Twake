import React, { FC } from 'react';
import RouterServices from 'app/services/RouterService';

import { Layout } from 'antd';
import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';

import './MainView.scss';
import NoApp from './NoApp';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import { useWatcher } from 'app/services/Observable/Observable';
import AccountStatusComponent from 'app/components/OnBoarding/AccountStatusComponent';

const MainView: FC = () => {
  const { companyId, workspaceId, channelId } = RouterServices.useRouteState(
    ({ companyId, workspaceId, channelId }) => {
      return { companyId, workspaceId, channelId };
    },
  );

  const loaded = useWatcher(ChannelsBarService, () => {
    return (
      ChannelsBarService.isReady(companyId, workspaceId) &&
      ChannelsBarService.isReady(companyId, workspaceId, ['applications']) &&
      ChannelsBarService.isReady(companyId, 'direct')
    );
  });
  const ready = loaded && !!companyId && !!workspaceId;

  if (ready && !channelId) {
    ChannelsBarService.autoSelectChannel(companyId, workspaceId);
  }

  return (
    <Layout className="global-view-layout">
      {!!channelId && ready && (
        <>
          <AccountStatusComponent />
          <MainHeader />
          <MainContent />
        </>
      )}
      {!channelId && ready && <NoApp />}
    </Layout>
  );
};

export default MainView;
