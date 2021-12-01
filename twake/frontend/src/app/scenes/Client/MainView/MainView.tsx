// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { FC, useEffect, useState } from 'react';
import { Layout } from 'antd';

import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';
import NoApp from './NoApp';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import { useWatcher } from 'app/services/Observable/Observable';
import AccountStatusComponent from 'app/components/OnBoarding/AccountStatusComponent';
import CompanyBillingBanner from 'app/components/OnBoarding/CompanyBillingBanner';
import './MainView.scss';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import useRouterWorkspace from 'app/state/recoil/hooks/useRouterWorkspace';
import useRouterChannel from 'app/state/recoil/hooks/useRouterChannel';

type PropsType = {
  className?: string;
};

const MainView: FC<PropsType> = ({ className }) => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();

  const loaded = useWatcher(ChannelsBarService, async () => {
    return (
      (await ChannelsBarService.isReady(companyId, workspaceId)) &&
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
          {companyId && <CompanyBillingBanner companyId={companyId || ''} />}
          <MainHeader />
          <MainContentWrapper key={companyId + workspaceId + channelId} />
        </>
      )}
      {!channelId && ready && <NoApp />}
    </Layout>
  );
};

//This is used to delay render and make rest of UI faster
export const MainContentWrapper = () => {
  const [delayed, setDelayed] = useState(true);

  //This delay make the app superfast
  useEffect(() => {
    setTimeout(() => setDelayed(false), 50);
  }, []);

  if (delayed) {
    return <></>;
  }

  return <MainContent />;
};

export default MainView;
