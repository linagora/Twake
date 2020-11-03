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
import 'antd/dist/antd.less';
import './Client.scss';
import MainView from './MainView/MainView.js';
import PublicMainView from './MainView/PublicMainView.js';
import ChannelsBar from './ChannelsBar/ChannelsBar.js';
import WorkspacesBar from './WorkspacesBar/WorkspacesBar';

import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';
import NotificationsBodyLayer from 'components/Notifications/NotificationsBodyLayer.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import UploadViewer from 'components/Uploads/UploadViewer.js';
import ConfigBodyLayer from 'components/Configurators/ConfigBodyLayer.js';
import Viewer from 'scenes/Apps/Drive/Viewer/Viewer.js';
import MediumPopupComponent from 'app/components/Modal/ModalComponent';
import ConnectionIndicator from 'components/ConnectionIndicator/ConnectionIndicator.js';

import SearchPopup from 'components/SearchPopup/SearchPopup.js';
import Globals from 'services/Globals.js';
import LoginServices from 'services/login/login';
import RouterServices from 'app/services/RouterServices';

import Collections, { Resource, Collection } from 'app/services/CollectionsReact/Collections';

/*
Collections.connect({
  transport: {
    socket: {
      url: 'ws://localhost:8000/',
      authenticate: {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAzODk3MDI3fQ.SLgSEQtsKSgh3k4YEQPmQCVER-_sMkeqrqepMgLT3BE',
      },
    },
    rest: {
      url: 'http://localhost:8000/internal/services',
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAzODk3MDI3fQ.SLgSEQtsKSgh3k4YEQPmQCVER-_sMkeqrqepMgLT3BE',
      },
    },
  },
});

type ChannelType = {
  id?: string;
  creator: string;
  name: string;
};

class Channel extends Resource<ChannelType> {
  setName(name: string) {
    this.data.name = (name || '').trim();
  }
  getName() {
    return this.data.name;
  }
}

const ChannelComponent = (props: { channelId: string; collectionPath: string }) => {
  const ChannelsCollection = Collection.get(props.collectionPath, Channel);

  const channel = ChannelsCollection.useWatcher(
    async () => await ChannelsCollection.findOne(props.channelId),
  );

  if (!channel) {
    return <tr />;
  }

  console.log('render ', props.channelId);

  return (
    <tr key={channel.id}>
      <td>{channel.id?.substr(0, 40)}</td>
      <td>{channel.getName()} </td>
      <td style={{ backgroundColor: channel.state.persisted ? 'green' : 'red' }}></td>
      <td style={{ backgroundColor: channel.state.shared ? 'green' : 'red' }}></td>
      <td style={{ backgroundColor: channel.state.upToDate ? 'green' : 'red' }}></td>
      <td>
        <button
          onClick={() => {
            channel.data.name = 'name_' + Math.floor(new Date().getTime() / 1000);
            ChannelsCollection.update(channel);
          }}
        >
          Change
        </button>
        <button onClick={() => ChannelsCollection.remove(channel)}>Delete</button>
      </td>
    </tr>
  );
};

export const test = (props: {}) => {
  const companyId = '0';
  const workspaceId = '0';
  const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/`;

  const ChannelsCollection = Collection.get(collectionPath, Channel);

  const [limit, setLimit] = useState(10);
  const channels =
    ChannelsCollection.useWatcher(async () => await ChannelsCollection.find({})) || [];

  //@ts-ignore
  window.ChannelsCollection = ChannelsCollection;

  console.log('render list', channels);

  return (
    <div>
      <table id="channel_list" style={{ border: '1px solid #000', borderCollapse: 'separate' }}>
        <thead>
          <tr>
            <td>Id</td>
            <td>Name</td>
            <td>Persi.</td>
            <td>Shared</td>
            <td>UpToD.</td>
            <td>Op</td>
          </tr>
        </thead>
        <tbody>
          {channels
            .sort((a, b) => (a.data.name as String).localeCompare(b.data.name))
            .map(channel => {
              return (
                <ChannelComponent
                  collectionPath={collectionPath}
                  channelId={channel.id}
                  key={channel.id}
                />
              );
            })}
        </tbody>
      </table>

      <button
        id="add_button"
        onClick={() => {
          const channel = new Channel({
            creator: 'creator_' + Math.floor(new Date().getTime() / 1000),
            name: '',
          });

          channel.setName('name_' + Math.floor(new Date().getTime() / 1000));

          ChannelsCollection.insert(channel);
        }}
      >
        Add
      </button>

      <button id="add_button" onClick={() => setLimit(channels.length + 10)}>
        More
      </button>
    </div>
  );
};*/

export default class Client extends Component {
  no_workspace: any = '';
  constructor(props: {}) {
    super(props);
    alertService.addListener(this);
    popupService.addListener(this);
    Workspaces.addListener(this);
    Languages.addListener(this);
    LoginServices.addListener(this);
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
    LoginServices.removeListener(this);
  }
  render() {
    if (LoginServices.state !== 'app') return <div></div>;

    var page: any = '';
    if (popupService.isOpen()) {
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
