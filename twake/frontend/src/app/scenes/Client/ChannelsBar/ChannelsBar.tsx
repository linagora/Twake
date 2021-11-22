// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { Suspense, useEffect } from 'react';
import classNames from 'classnames';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout, Skeleton } from 'antd';

import CurrentUser from './Parts/CurrentUser/CurrentUser';
import { CompanyApplications} from './ChannelsApps/ChannelsApps';
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
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import AccessRightsService from 'app/services/AccessRightsService';
import useRouterCompany from 'app/state/recoil/hooks/useRouterCompany';
import useRouterWorkspace from 'app/state/recoil/hooks/useRouterWorkspace';
import { LoadingCompany } from './Parts/CurrentUser/CompanyHeader/CompanyHeader';

import './ChannelsBar.scss';

export const LoadingChannels = () => {
  return (
    <Layout.Sider theme="light" width={220} className={classNames('channels_view_loading')} style={{ height: '100%', width: "90%", alignItems: 'center' }}>
      <LoadingCompany />
      <Channel_loading />
    </Layout.Sider> 
    
  );
};

export default () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace(); 

  //Need to be fix, here ready always == true
  const ready = ChannelsBarService.useWatcher(async () => {
    return (
      await ChannelsBarService.isReady(companyId, workspaceId) &&
      //ChannelsBarService.isReady(companyId, workspaceId, ['applications']) &&
      ChannelsBarService.isReady(companyId, 'direct')
    );
  });

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

  useEffect(() => {
    Shortcuts.addShortcut(openWorkspaceChannelList);
    return () => {
      Shortcuts.removeShortcut(openWorkspaceChannelList);
    };
  }, []);

  if (!companyId || !workspaceId) {
    return <></>;
  }
  return (
    <Layout.Sider
      theme="light"
      width={220}
      className={classNames('channels_view', {
        loading: !ready,
        loading_render: !ready,
      })}
      style={{ height: '100%' }}
    >
      <CurrentUser />

      {!ready && <LoadingChannels />}
        <ScrollWithHiddenComponents
          disabled={!ready}
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

export const Channel_loading = () => {
  return (
    <div className="channels_view_loader ">
      <div className="applications_channels_loader small-x-margin">
        <Skeleton title={false} paragraph={{rows : 3, width:["45%", "40%","50%"]}}/>
      </div>
      <div className="channels_loader small-x-margin">
          <Skeleton title={{style:{height:22} , width:"45%"}} paragraph={{rows:4, width:["100%", "80%","90%","100"]}}/>
          <Skeleton title={{style:{height:22}, width:"55%"}} paragraph={{rows:4, width:["60%", "90%","100%", "85%"]}}/>
      </div>
    </div>
  );
}
