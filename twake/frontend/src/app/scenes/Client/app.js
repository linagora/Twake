import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupService from 'services/popupManager/popupManager.js';
import alertService from 'services/AlertManager/AlertManager.js';
import ListenWorkspacesList from 'services/workspaces/listen_workspaces_list.js';
import PopupComponent from 'components/PopupComponent/PopupComponent.js';
import AlertLayout from 'components/Alert/Layout.js';
import 'components/constants.scss';
import './app.less';

import { Layout } from 'antd';
import MainView from './MainView/MainView.js';
import PublicMainView from './MainView/PublicMainView.js';
import ChannelsBar from './ChannelsBar/ChannelsBar.js';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar.js';

import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import NotificationsBodyLayer from 'components/Notifications/NotificationsBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import UploadViewer from 'components/Uploads/UploadViewer.js';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer.js';
import MediumPopupComponent from 'components/MediumPopup/MediumPopupComponent.js';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator.js';

import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import Globals from 'services/Globals.js';

export default class App extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      workspaces: Workspaces,
      popupService: popupService,
      alertService: alertService,
    };
    alertService.addListener(this);
    popupService.addListener(this);
    Workspaces.addListener(this);
    Languages.addListener(this);
  }
  componentWillMount() {
    ListenWorkspacesList.startListen();
  }
  componentWillUnmount() {
    ListenWorkspacesList.cancelListen();
    popupService.removeListener(this);
    alertService.removeListener(this);
    Languages.removeListener(this);
    Workspaces.removeListener(this);
  }
  render() {
    var page = '';
    if (this.state.popupService.isOpen()) {
      page = <PopupComponent key="PopupComponent" />;
    } else {
      var no_workspace =
        Object.keys(Workspaces.user_workspaces).length <= 1 &&
        Object.keys(Groups.user_groups).length <= 1;
      var workspace_changes = this.no_workspace === undefined || no_workspace != this.no_workspace;
      this.no_workspace = no_workspace;

      if (Globals.store_public_access_get_data) {
        page = (
          <div key="appPage" className={'appPage public'}>
            <PublicMainView />
          </div>
        );
      } else {
        page = (
          <Layout
            key="appPage"
            className={
              'appPage ' +
              (no_workspace
                ? 'no_workspaces '
                : 'has_workspaces ') /* + (workspace_changes?"animated ":"")*/
            }
            hasSider
          >
            <WorkspacesBar />
            <ChannelsBar />
            <MainView />
          </Layout>
        );
      }
    }

    var comp = [
      page,
      <MenusBodyLayer key="MenusBodyLayer" />,
      <NotificationsBodyLayer key="NotificationsBodyLayer" />,
      <DraggableBodyLayer key="DraggableBodyLayer" />,
      <UploadViewer key="UploadViewer" />,
      <ConfigBodyLayer key="ConfigBodyLayer" />,
      <Viewer key="DriveViewer" />,
      <MediumPopupComponent key="MediumPopupComponent" />,
      <SearchPopup key="SearchPopup" />,
      <ConnectionIndicator key="ConnectionIndicator" />,
    ];

    if (alertService.isOpen()) {
      comp.push(<AlertLayout key="AlertLayout" />);
    }

    return comp;
  }
}
