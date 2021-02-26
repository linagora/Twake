import React, { useEffect, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupService from 'services/popupManager/popupManager.js';
import ListenWorkspacesList from 'services/workspaces/listen_workspaces_list.js';
import PopupComponent from 'components/PopupComponent/PopupComponent.js';

import { Layout } from 'antd';
import './Client.scss';

import MainView from './MainView/MainView';

import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import UploadViewer from 'components/Uploads/UploadViewer.js';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer.js';
import ModalComponent from 'app/components/Modal/ModalComponent';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator.js';

import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import LoginService from 'services/login/login';
import { Menu } from 'react-feather';
import NewVersionComponent from 'components/NewVersion/NewVersionComponent';
import SideBars from './SideBars';

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

  let page: JSX.Element = <></>;
  if (popupService.isOpen()) {
    page = <PopupComponent key="PopupComponent" />;
  } else {
    if (LoginService.currentUserId) {
      page = (
        <>
          <Layout hasSider>
            <Layout.Sider
              trigger={<Menu size={16} />}
              breakpoint="lg"
              collapsedWidth="0"
              theme="light"
              width={290}
            >
              <SideBars />
            </Layout.Sider>
            <MainView />
          </Layout>
        </>
      );
    }
  }

  return (
    <>
      <NewVersionComponent>{page}</NewVersionComponent>
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
