import React, { Component, useEffect, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupService from 'services/popupManager/popupManager.js';
import ListenWorkspacesList from 'services/workspaces/listen_workspaces_list.js';
import PopupComponent from 'components/PopupComponent/PopupComponent.js';

import { Layout } from 'antd';
import './Client.scss';
//import MainView from './MainView/DeprecatedMainView';
import MainView from './MainView/MainView';
import PublicMainView from './MainView/PublicMainView.js';
import ChannelsBar from './ChannelsBar/ChannelsBar';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar';

import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import UploadViewer from 'components/Uploads/UploadViewer.js';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer.js';
import ModalComponent from 'app/components/Modal/ModalComponent';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator.js';

import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import Globals from 'services/Globals.js';
import LoginService from 'services/login/login';

export default (): JSX.Element => {
  popupService.useListener(useState);
  Workspaces.useListener(useState);
  Languages.useListener(useState);
  LoginService.useListener(useState);
  useEffect(() => {
    LoginService.init();
    ListenWorkspacesList.startListen();
    return () => {
      ListenWorkspacesList.cancelListen();
    };
  }, []);

  var page: any = '';
  if (popupService.isOpen()) {
    page = <PopupComponent key="PopupComponent" />;
  } else {
    if (Globals.store_public_access_get_data) {
      page = (
        <div key="appPage" className={'appPage public'}>
          <PublicMainView />
        </div>
      );
    } else {
      //Wait for the user to be connected
      if (LoginService.currentUserId) {
        page = (
          <Layout key="appPage" className={'appPage '} hasSider>
            <Layout.Sider
              breakpoint="md"
              collapsedWidth="0"
              theme="light"
              width={290}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Layout style={{ height: '100%' }}>
                <WorkspacesBar />
                <ChannelsBar />
              </Layout>
            </Layout.Sider>
            <MainView />
          </Layout>
        );
      }
    }
  }

  return (
    <>
      {page}
      <MenusBodyLayer />
      <DraggableBodyLayer />
      <UploadViewer />
      <ConfigBodyLayer />
      <Viewer />
      <ModalComponent />
      <SearchPopup />
      <ConnectionIndicator />
    </>
  );
};
