// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { Layout } from 'antd';
import { FC, useEffect, useState } from 'react';

import AccountStatusComponent from 'app/components/on-boarding/account-status-component';
import CompanyBillingBanner from 'app/components/on-boarding/company-billing-banner';
import { useWatcher } from 'app/deprecated/Observable/Observable';
import { useCompanyApplications } from 'app/features/applications/hooks/use-company-applications';
import { useChannel, useIsChannelMember } from 'app/features/channels/hooks/use-channel';
import ChannelsBarService from 'app/features/channels/services/channels-bar-service';
import WindowState from 'app/features/global/utils/window';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import MainViewService from 'app/features/router/services/main-view-service';
import ContentRestricted from './ContentRestricted';
import MainContent from './MainContent';
import MainHeader from './MainHeader/MainHeader';
import './MainView.scss';
import NoApp from './NoApp';

type PropsType = {
  className?: string;
  onClick?: Function;
};

const MainView: FC<PropsType> = ({ className, onClick }) => {
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
        <Layout
          onClick={onClick as any}
          className={'global-view-layout ' + (className ? className : '')}
        >
          <ContentRestricted />
        </Layout>
      </>
    );
  }

  return (
    <Layout
      onClick={onClick as any}
      className={'global-view-layout ' + (className ? className : '')}
    >
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
