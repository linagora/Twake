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
import useRouterWorkspace from 'app/state/recoil/hooks/useRouterWorkspace';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import useRouterChannel from 'app/state/recoil/hooks/useRouterChannel';
import './MainView.scss';

//This is used to delay render and make rest of UI faster
export const MainViewWrapper = ({ className }: { className: string }) => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();

  return (
    <MainView
      className={className}
      key={companyId + workspaceId + channelId}
      companyId={companyId}
      workspaceId={workspaceId}
      channelId={channelId}
    />
  );
};

type PropsType = {
  className?: string;
  companyId?: string;
  workspaceId?: string;
  channelId?: string;
};

const MainView: FC<PropsType> = ({ className, companyId, workspaceId, channelId }) => {
  const [delayed, setDelayed] = useState(true);

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

  //This delay make the app superfast
  useEffect(() => {
    setTimeout(() => setDelayed(false), 50);
  }, []);

  if (delayed) {
    return <></>;
  }

  return (
    <Layout className={'global-view-layout ' + (className ? className : '')}>
      {!!channelId && ready && (
        <>
          <AccountStatusComponent />
          {companyId && <CompanyBillingBanner companyId={companyId || ''} />}
          <MainHeader />
          <MainContent />
        </>
      )}
      {!channelId && ready && <NoApp />}
    </Layout>
  );
};

export default MainView;
