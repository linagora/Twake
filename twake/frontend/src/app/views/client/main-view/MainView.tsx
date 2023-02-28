// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { FC, useEffect, useState } from 'react';
import { Layout } from 'antd';

import MainHeader from './MainHeader/MainHeader';
import MainContent from './MainContent';
import NoApp from './NoApp';
import ChannelsBarService from 'app/features/channels/services/channels-bar-service';
import { useWatcher } from 'app/deprecated/Observable/Observable';
import AccountStatusComponent from 'app/components/on-boarding/account-status-component';
import CompanyBillingBanner from 'app/components/on-boarding/company-billing-banner';
import './MainView.scss';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import MainViewService from 'app/features/router/services/main-view-service';
import WindowState from 'app/features/global/utils/window';
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';
import { useChannel, useIsChannelMember } from 'app/features/channels/hooks/use-channel';
import ContentRestricted from './ContentRestricted';

type PropsType = {
  className?: string;
};

const MainView: FC<PropsType> = ({ className }) => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();
  const { applications } = useCompanyApplications();
  const { channel, loading: channelLoading } = useChannel(channelId);
  const isChannelMember = useIsChannelMember(channelId);

  const loaded = useWatcher(ChannelsBarService, async () => {
    return (
      (await ChannelsBarService.isReady(companyId, workspaceId)) &&
      ChannelsBarService.isReady(companyId, 'direct')
    );
  });
  const ready = !(channelLoading && !channel) && loaded && !!companyId && !!workspaceId;

  const updateView = () => {
    if (channelId) {
      const app = applications.find(a => a.id === channelId);
      MainViewService.select(channelId, {
        app: app || {
          identity: {
            code: 'messages',
            name: '',
            icon: '',
            description: '',
            website: '',
            categories: [],
            compatibility: [],
          },
        },
        context: { type: app ? 'application' : 'channel' },
        hasTabs: channel?.visibility !== 'direct' && !app,
      });
      WindowState.setSuffix(channel?.name || app?.identity?.name);
    }
  };

  if (channelId && MainViewService.getId() !== channelId) updateView();

  if (
    ready &&
    !isChannelMember &&
    MainViewService.getViewType() === 'channel' &&
    channel?.visibility === 'private'
  ) {
    return (
      <>
        <Layout className={'global-view-layout ' + (className ? className : '')}>
          <ContentRestricted />
        </Layout>
      </>
    );
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

export default ({ className }: PropsType) => {
  //This is a hack because main view is displayed before we detect the current "channel" is in fact an application
  const channelId = useRouterChannel();
  const { applications } = useCompanyApplications();
  const isChannelMember = useIsChannelMember(channelId);

  if (applications.length === 0 && !isChannelMember) return <></>;

  return <MainView className={className} />;
};
