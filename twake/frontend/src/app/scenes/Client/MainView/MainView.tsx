// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { FC } from 'react';
import { Layout } from 'antd';

import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';
import NoApp from './NoApp';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import { useWatcher } from 'app/services/Observable/Observable';
import AccountStatusComponent from 'app/components/OnBoarding/AccountStatusComponent';
import CompanyBillingBanner from 'app/components/OnBoarding/CompanyBillingBanner';
import useRouteState from 'app/services/hooks/useRouteState';

import './MainView.scss';

type PropsType = {
  className?: string;
};

const MainView: FC<PropsType> = ({ className }) => {
  const { companyId, workspaceId, channelId } = useRouteState(
    ({ companyId, workspaceId, channelId }) => ({ companyId, workspaceId, channelId }),
  );
  const loaded = useWatcher(ChannelsBarService, () => {
    return (
      ChannelsBarService.isReady(companyId, workspaceId) &&
      ChannelsBarService.isReady(companyId, 'direct')
    );
  });
  const ready = loaded && !!companyId && !!workspaceId;

  if (ready && !channelId) {
    ChannelsBarService.autoSelectChannel(companyId, workspaceId);
  }

  return (
    <Layout className={'global-view-layout ' + (className ? className : '')}>
      {!!channelId && ready && (
        <>
          <AccountStatusComponent />
          {companyId && <CompanyBillingBanner companyId={companyId} />}
          <MainHeader />
          <MainContent />
        </>
      )}
      {!channelId && ready && <NoApp />}
    </Layout>
  );
};

export default MainView;
