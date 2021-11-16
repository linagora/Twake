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
import useRouterWorkspace from 'app/state/recoil/hooks/useRouterWorkspace';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import useRouterChannel from 'app/state/recoil/hooks/useRouterChannel';

import './MainView.scss';



type PropsType = {
  className?: string;
};

const MainView: FC<PropsType> = ({ className }) => {
  
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();

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
          {companyId && <CompanyBillingBanner companyId={companyId || ""} />}
          <MainHeader />
          <MainContent />
        </>
      )}
      {!channelId && ready && <NoApp />}
    </Layout>
  );
};

export default MainView;
