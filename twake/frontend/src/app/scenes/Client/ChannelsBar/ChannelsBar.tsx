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
import Shortcuts, { defaultShortcutsMap, ShortcutType } from 'app/services/ShortcutService';
import AddUserButton from 'components/AddUserButton/AddUserButton';
import Workspaces from 'services/workspaces/workspaces';
import ModalManager from 'app/components/Modal/ModalManager';
import WorkspaceChannelList from './Modals/WorkspaceChannelList';
import ScrollWithHiddenComponents from 'app/components/ScrollHiddenComponents/ScrollWithHiddenComponents';
import HiddenNotificationsButton from 'app/components/ScrollHiddenComponents/HiddenNotificationsButton';
import AccessRightsService from 'app/services/AccessRightsService';
import useRouterCompany from 'app/state/recoil/hooks/router/useRouterCompany';
import useRouterWorkspace from 'app/state/recoil/hooks/router/useRouterWorkspace';
import './ChannelsBar.scss';
import { useCurrentWorkspace } from 'app/state/recoil/hooks/useWorkspaces';
import useChannelWritingActivity from 'app/state/recoil/hooks/useChannelWritingActivity';

export default () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const { workspace } = useCurrentWorkspace();
  useChannelWritingActivity();

  useEffect(() => {
    const openWorkspaceChannelList: ShortcutType = {
      shortcut: defaultShortcutsMap.SEARCH_CHANNEL,
      handler: (event: any) => {
        event.preventDefault();
        if (ModalManager.isOpen()) {
          ModalManager.close();

          return;
        }

        ModalManager.open(<WorkspaceChannelList />, {
          position: 'center',
          size: { width: '500px' },
        });
      },
    };

    Shortcuts.addShortcut(openWorkspaceChannelList);
    return () => {
      Shortcuts.removeShortcut(openWorkspaceChannelList);
    };
  }, []);

  if (!companyId || !workspaceId || !workspace) {
    return <></>;
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
            Workspaces.getCurrentWorkspace().stats.total_members <= 5 && <AddUserButton />}
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
        <Skeleton title={{ width: '50%' }} paragraph={{ rows: 3, width: '100%' }} />
        <Skeleton title={{ width: '50%' }} paragraph={{ rows: 4, width: '100%' }} />
        <Skeleton title={{ width: '50%' }} paragraph={{ rows: 4, width: '100%' }} />
      </div>
    </div>
  );
};
