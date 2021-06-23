import React, { useEffect } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Layout } from 'antd';
import CurrentUser from './Parts/CurrentUser/CurrentUser.js';
import ChannelsApps from './ChannelsApps/ChannelsApps';
import ChannelsWorkspace from './ChannelsWorkspace/ChannelsWorkspace';
import ChannelsUser from './ChannelsUser/ChannelsUser';
import Footer from './Parts/Footer.js';
import RouterServices from 'app/services/RouterService';
import './ChannelsBar.scss';
import Shortcuts, { defaultShortcutsMap, ShortcutType } from 'app/services/ShortcutService';
import AddUserButton from 'components/AddUserButton/AddUserButton';
import Workspaces from 'services/workspaces/workspaces.js';
import ModalManager from 'app/components/Modal/ModalManager';
import WorkspaceChannelList from './Modals/WorkspaceChannelList';
import ScrollWithHiddenComponents from 'app/components/ScrollHiddenComponents/ScrollWithHiddenComponents';
import HiddenNotificationsButton from 'app/components/ScrollHiddenComponents/HiddenNotificationsButton';
import ChannelsBarService from 'app/services/channels/ChannelsBarService';
import AccessRightsService from 'app/services/AccessRightsService';

export default () => {
  const { companyId, workspaceId } = RouterServices.getStateFromRoute();

  const ready = ChannelsBarService.useWatcher(() => {
    return (
      ChannelsBarService.isReady(companyId, workspaceId) &&
      ChannelsBarService.isReady(companyId, workspaceId, ['applications']) &&
      ChannelsBarService.isReady(companyId, 'direct')
    );
  });

  const openWorkspaceChannelList: ShortcutType = {
    shortcut: defaultShortcutsMap.SEARCH_CHANNEL,
    handler: (event: any) => {
      event.preventDefault();
      if (ModalManager.isOpen() === false) {
        return ModalManager.open(<WorkspaceChannelList />, {
          position: 'center',
          size: { width: '500px' },
        });
      } else return ModalManager.close();
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
      className={'channels_view ' + (ready ? '' : 'loading loading_render')}
      style={{ height: '100%' }}
    >
      <CurrentUser />

      {!ready && (
        <div style={{ paddingTop: 8 }}>
          <div className="channel" />
          <div className="channel" />
          <div className="channel" />
          <div className="channel_category" />
          <div className="channel" />
          <div className="channel" />
          <div className="channel_category" />
          <div className="channel" />
          <div className="channel" />
          <div className="channel" />
          <div className="channel" />
          <div className="channel_category" />
          <div className="channel" />
          <div className="channel" />
          <div className="channel" />
        </div>
      )}

      <ScrollWithHiddenComponents
        disabled={!ready}
        tag="channel_bar_component"
        scrollTopComponent={<HiddenNotificationsButton position="top" type="important" />}
        scrollBottomComponent={<HiddenNotificationsButton position="bottom" type="important" />}
      >
        <PerfectScrollbar options={{ suppressScrollX: true }}>
          <ChannelsApps key={workspaceId} />
          {AccessRightsService.hasLevel(workspaceId, 'administrator') &&
            Workspaces.getCurrentWorkspace().stats.total_members <= 5 && <AddUserButton />}
          <ChannelsWorkspace key={'workspace_chans_' + workspaceId} />
          <ChannelsUser key={companyId} />
        </PerfectScrollbar>
      </ScrollWithHiddenComponents>
      <Footer />
    </Layout.Sider>
  );
};
