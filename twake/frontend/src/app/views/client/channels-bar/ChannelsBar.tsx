// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense, useEffect } from 'react';
import classNames from 'classnames';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout, Skeleton } from 'antd';

import CurrentUser from './Parts/CurrentUser/CurrentUser';
import { CompanyApplications } from './ChannelsApps/ChannelsApps';
import ChannelsWorkspace from './ChannelsWorkspace/ChannelsWorkspace';
import ChannelsUser from './ChannelsUser/ChannelsUser';
import Footer from './Parts/Footer.js';
import Shortcuts, {
  defaultShortcutsMap,
  ShortcutType,
} from 'app/features/global/services/shortcut-service';
import AddUserButton from 'components/add-user-button/add-user-button';
import Workspaces from 'app/deprecated/workspaces/workspaces';
import ScrollWithHiddenComponents from 'app/components/scroll-hidden-components/scroll-with-hidden-components';
import HiddenNotificationsButton from 'app/components/scroll-hidden-components/hidden-notifications-button';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';
import useChannelWritingActivity from 'app/features/channels/hooks/use-channel-writing-activity';
import { useChannelsBarLoader } from 'app/features/channels/hooks/use-channels-bar-loader';
import { usePublicOrPrivateChannelsSetup } from 'app/features/channels/hooks/use-public-or-private-channels';
import { useDirectChannelsSetup } from 'app/features/channels/hooks/use-direct-channels';
import { useSetLastWorkspacePreference } from 'app/features/users/hooks/use-set-last-workspace-preferences';
import { useAutoSelectChannel } from 'app/features/channels/hooks/use-autoselect-channel';

import './ChannelsBar.scss';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { useSetRecoilState } from 'recoil';
import { SearchInputState } from 'app/features/search/state/search-input';

export default () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const { workspace } = useCurrentWorkspace();

  useAutoSelectChannel();

  useSetLastWorkspacePreference();

  useChannelWritingActivity();
  const { loading } = useChannelsBarLoader({ companyId, workspaceId });

  usePublicOrPrivateChannelsSetup();
  useDirectChannelsSetup();

  const { setOpen: setSearchopen } = useSearchModal();
  const setSearchInput = useSetRecoilState(SearchInputState);

  useEffect(() => {
    const openWorkspaceChannelList: ShortcutType = {
      shortcut: defaultShortcutsMap.SEARCH_CHANNEL,
      handler: event => {
        event.preventDefault();
        setSearchopen(true);
        setSearchInput({ query: '' });
      },
    };

    Shortcuts.addShortcut(openWorkspaceChannelList);
    return () => {
      Shortcuts.removeShortcut(openWorkspaceChannelList);
    };
  }, []);

  if (loading || !companyId || !workspaceId || !workspace) {
    return <LoadingChannelBar />;
  }

  return (
    <Layout.Sider
      theme="light"
      width={220}
      className={classNames('channels_view', {})}
      style={{ height: '100%' }}
    >
      <CurrentUser />

      <ScrollWithHiddenComponents
        tag="channel_bar_component"
        scrollTopComponent={<HiddenNotificationsButton position="top" type="important" />}
        scrollBottomComponent={<HiddenNotificationsButton position="bottom" type="important" />}
      >
        <PerfectScrollbar options={{ suppressScrollX: true }}>
          <Suspense fallback={<></>}>
            <CompanyApplications companyId={companyId} />
          </Suspense>
          <ChannelsWorkspace key={`workspace_chans_${workspaceId}`} />
          <ChannelsUser key={companyId} />
          {AccessRightsService.hasLevel(workspaceId, 'moderator') &&
            (Workspaces.getCurrentWorkspace()?.stats?.total_members || 0) <= 5 && <AddUserButton />}
        </PerfectScrollbar>
      </ScrollWithHiddenComponents>
      <Footer />
    </Layout.Sider>
  );
};

export const LoadingChannelBar = () => {
  return (
    <Layout.Sider
      theme="light"
      width={220}
      className={classNames('channels_view_loading channels_view')}
      style={{ height: '100%', width: '90%', alignItems: 'center' }}
    >
      <ChannelLoading />
    </Layout.Sider>
  );
};

export const ChannelLoading = () => {
  return (
    <div className="channels_view_loader ">
      <div className="small-x-margin">
        <Skeleton
          className="mt-8"
          title={{ width: '50%' }}
          paragraph={{ rows: 3, width: '100%' }}
        />
        <Skeleton
          className="mt-8"
          title={{ width: '50%' }}
          paragraph={{ rows: 4, width: '100%' }}
        />
        <Skeleton
          className="mt-8"
          title={{ width: '50%' }}
          paragraph={{ rows: 4, width: '100%' }}
        />
      </div>
    </div>
  );
};
