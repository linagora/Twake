import React, { Component } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Workspaces from 'services/workspaces/workspaces.js';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import UserService from 'services/user/user.js';
import ChannelsService from 'services/channels/channels.js';
import Groups from 'services/workspaces/groups.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import { Layout } from 'antd';
import GroupSwitch from 'components/Leftbar/GroupSwitch/GroupSwitch.js';
import Languages from 'services/languages/languages.js';
import CurrentUser from './CurrentUser/CurrentUser.js';
import ChannelsApps from './ChannelsApps/ChannelsApps.js';
import { Workspace } from './Workspace/workspace';
import { ChannelsUser } from './ChannelsUser/ChannelsUser';
import Tutorial from './Tutorial.js';
import Footer from './Footer.js';
import ElectronService from 'services/electron/electron.js';

import Collections from 'services/Collections/Collections';

import './ChannelsBar.scss';
import { ChannelResource } from 'app/models/Channel';

export default class ChannelsBar extends Component {
  // constructor() {
  //   super();
  //   Workspaces.addListener(this);
  //   Groups.addListener(this);
  //   DepreciatedCollections.get('groups').addListener(this);
  //   DepreciatedCollections.get('workspaces').addListener(this);
  //   WorkspaceUserRights.addListener(this);

  //   window.Collections = Collections;
  //   window.ChannelResource = ChannelResource;
  // }
  // componentDidMount() {
  //   this.componentDidUpdate();
  // }

  // componentWillUnmount() {
  //   Workspaces.removeListener(this);
  //   Groups.removeListener(this);
  //   WorkspaceUserRights.removeListener(this);
  //   DepreciatedCollections.get('groups').removeListener(this);
  //   DepreciatedCollections.get('workspaces').removeListener(this);
  //   DepreciatedCollections.get('channels').removeSource('channels_' + this.old_workspace);
  //   this.old_workspace = undefined;
  // }

  // componentDidUpdate() {
  //   if (this.old_workspace != Workspaces.currentWorkspaceId && Workspaces.currentWorkspaceId) {
  //     if (this.old_workspace) {
  //       DepreciatedCollections.get('channels').removeSource('channels_' + this.old_workspace);
  //     }

  //     DepreciatedCollections.get('channels').addSource(
  //       {
  //         http_base_url: 'channels',
  //         http_options: {
  //           workspace_id: Workspaces.currentWorkspaceId,
  //         },
  //         websockets: [
  //           {
  //             uri: 'channels/workspace/' + Workspaces.currentWorkspaceId,
  //             options: { type: 'channels/workspace' },
  //           },
  //           {
  //             uri:
  //               'channels/workspace_private/' +
  //               Workspaces.currentWorkspaceId +
  //               '/' +
  //               UserService.getCurrentUserId(),
  //             options: { type: 'channels/workspace_private' },
  //           },
  //         ],
  //       },
  //       'channels_' + Workspaces.currentWorkspaceId,
  //     );

  //     ChannelsService.initSelection();

  //     this.old_workspace = Workspaces.currentWorkspaceId;
  //   }
  // }

  render() {
    // var group = DepreciatedCollections.get('groups').find(Groups.currentGroupId);
    // var workspace = DepreciatedCollections.get('workspaces').find(Workspaces.currentWorkspaceId);
    // var no_workspace =
    //   Object.keys(Workspaces.user_workspaces).length <= 1 &&
    //   Object.keys(Groups.user_groups).length <= 1;

    return (
      <Layout.Sider
        theme="light"
        width={() => ElectronService.isElectron()}
        className="channels_view fade_in"
      >
        <CurrentUser />
        <PerfectScrollbar component="div">
          <ChannelsApps />
          <Workspace />
          <ChannelsUser />
        </PerfectScrollbar>
        <Tutorial />
        <Footer />
      </Layout.Sider>
    );
  }
}

// Change the name of channel when it's group chat
// Add guest icon
// Add selected channel in purple
