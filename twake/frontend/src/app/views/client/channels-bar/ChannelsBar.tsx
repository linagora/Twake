// eslint-disable-next-line @typescript-eslint/no-use-before-define
import { Layout, Skeleton } from 'antd';
import classNames from 'classnames';
import { Suspense, useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import HiddenNotificationsButton from 'app/components/scroll-hidden-components/hidden-notifications-button';
import ScrollWithHiddenComponents from 'app/components/scroll-hidden-components/scroll-with-hidden-components';
import Workspaces from 'app/deprecated/workspaces/workspaces';
import { useAutoSelectChannel } from 'app/features/channels/hooks/use-autoselect-channel';
import useChannelWritingActivity from 'app/features/channels/hooks/use-channel-writing-activity';
import { useChannelsBarLoader } from 'app/features/channels/hooks/use-channels-bar-loader';
import { useDirectChannelsSetup } from 'app/features/channels/hooks/use-direct-channels';
import { usePublicOrPrivateChannelsSetup } from 'app/features/channels/hooks/use-public-or-private-channels';
import Shortcuts, {
  defaultShortcutsMap,
  ShortcutType,
} from 'app/features/global/services/shortcut-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useSetLastWorkspacePreference } from 'app/features/users/hooks/use-set-last-workspace-preferences';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';
import AddUserButton from 'components/add-user-button/add-user-button';
import { CompanyApplications } from './ChannelsApps/ChannelsApps';
import ChannelsUser from './ChannelsUser/ChannelsUser';
import ChannelsWorkspace from './ChannelsWorkspace/ChannelsWorkspace';
import Footer from './Parts/Footer';

import { useSearchModal } from 'app/features/search/hooks/use-search';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useSetRecoilState } from 'recoil';
import './ChannelsBar.scss';

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
      width={'100%'}
      className={'bg-transparent ' + classNames('channels_view', {})}
      style={{ height: '100%' }}
    >
      {/*<CurrentUser />*/}

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
      className={'bg-transparent ' + classNames('channels_view_loading channels_view')}
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
