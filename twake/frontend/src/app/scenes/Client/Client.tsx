// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';
import { Menu } from 'react-feather';
import { Layout } from 'antd';

import Languages from 'services/languages/languages';
import Workspaces from 'services/workspaces/workspaces.js';
import popupService from 'services/popupManager/popupManager.js';
import ListenWorkspacesList from 'services/workspaces/listen_workspaces_list.js';
import PopupComponent from 'components/PopupComponent/PopupComponent.js';
import MainView from './MainView/MainView';
import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import UploadViewer from 'components/Uploads/UploadViewer.js';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer';
import ModalComponent from 'app/components/Modal/ModalComponent';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator.js';
import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import LoginService from 'services/login/login';
import NewVersionComponent from 'components/NewVersion/NewVersionComponent';
import SideBars from './SideBars';
import RouterServices from 'app/services/RouterService';
import CompanyStatusComponent from 'app/components/OnBoarding/CompanyStatusComponent';

import './Client.scss';

export default (): JSX.Element => {
  const { companyId, workspaceId } = RouterServices.useRouteState();
  const [menuIsOpen, setMenuIsOpen] = useState(false);

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
        <Layout className="appPage fade_in">
          <NewVersionComponent />
          {companyId && workspaceId && <CompanyStatusComponent />}
          <Layout hasSider>
            <Layout.Sider
              trigger={<Menu size={16} />}
              breakpoint="lg"
              collapsedWidth="0"
              theme="light"
              width={290}
              onCollapse={(collapsed, type) => {
                if(type === 'responsive'){
                  setMenuIsOpen(false);
                  return;
                }
                setMenuIsOpen(!collapsed);
              }}
            >
              <SideBars />
            </Layout.Sider>
            <MainView className={menuIsOpen ? "collapsed" : ""} key={'mainview-' + companyId + '-' + workspaceId} />
          </Layout>
        </Layout>
      );
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
