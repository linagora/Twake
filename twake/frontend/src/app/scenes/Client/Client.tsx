import React, { Component, useEffect, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupService from 'services/popupManager/popupManager.js';
import alertService from 'services/AlertManager/AlertManager.js';
import ListenWorkspacesList from 'services/workspaces/listen_workspaces_list.js';
import PopupComponent from 'components/PopupComponent/PopupComponent.js';
import AlertLayout from 'components/Alert/Layout.js';

import { Layout } from 'antd';
import './Client.scss';
import MainView from './MainView/MainView.js';
import PublicMainView from './MainView/PublicMainView.js';
import ChannelsBar from './ChannelsBar/ChannelsBar.js';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar';

import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import UploadViewer from 'components/Uploads/UploadViewer.js';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer.js';
import MediumPopupComponent from 'app/components/Modal/ModalComponent';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator.js';

import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import Globals from 'services/Globals.js';
import LoginService from 'services/login/login';

export default (): JSX.Element => {
  alertService.useListener(useState);
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
            <WorkspacesBar />
            <ChannelsBar />
            {
              // TO REMOVE
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <h1>MainView will be disabled for the moment</h1>
                <br />
                <small>Waiting for the router implementation</small>
              </div>
            }
            {/* <MainView /> */}
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
      <MediumPopupComponent />
      <SearchPopup />
      <ConnectionIndicator />
      {alertService.isOpen() && <AlertLayout />}
    </>
  );
};
