import React from 'react';
import Observable from 'app/services/Depreciated/observable.js';
import CurrentUser from 'app/services/user/CurrentUser';
import Api from 'services/Api';
import ws from 'services/websocket.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Groups from './groups.js';
import Workspaces from './workspaces.js';
import Globals from 'services/Globals';
import Icon from 'app/components/Icon/Icon';
import { Folder, Calendar, CheckSquare, Hexagon } from 'react-feather';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';

class WorkspacesApps extends Observable {
  constructor() {
    super();
    this.setObservableName('workspaces_apps');

    Collections.get('applications');
    var options = {
      base_url: 'applications',
      use_cache: true,
    };
    Collections.updateOptions('applications', options);

    this.apps_by_workspace = {};
    this.apps_by_group = {};
    this.findingApp = {};
    this.did_first_load = {};

    Globals.window.workspacesApps = this;

    this.loading_by_workspace = {};
  }

  getApps() {
    var workspace_apps_channels = Collections.get('channels').findBy({
      direct: false,
      application: true,
      original_workspace: Workspaces.currentWorkspaceId,
    });

    var workspace_apps = workspace_apps_channels
      .filter(channel => channel)
      .filter(
        channel =>
          channel.app_id &&
          channel.members &&
          channel.members.length &&
          (channel.members || []).concat(channel.ext_members || []).indexOf(CurrentUser.get().id) >=
            0,
      )
      .map(ch => {
        return Collections.get('applications').find(ch.app_id);
      });

    return workspace_apps;
  }

  getApp(id, callback = undefined) {
    if (this.findingApp[id]) {
      return;
    }

    this.findingApp[id] = true;

    Api.post('/ajax/market/app/find', { id: id }, res => {
      if (res.data) {
        Collections.get('applications').updateObject(res.data);
        this.findingApp[id] = false;
        if (callback) callback(res.data);
      }
    });
  }

  notifyApp(app_id, type, event, data, workspace_id = undefined, group_id = undefined) {
    workspace_id = workspace_id || Workspaces.currentWorkspaceId;
    group_id = group_id || Workspaces.currentGroupId;

    data.connection_id = CurrentUser.unique_connection_id;

    // eslint-disable-next-line no-redeclare
    var data = {
      workspace_id: workspace_id,
      group_id: group_id,
      app_id: app_id,
      type: type,
      event: event,
      data: data,
    };

    Api.post('/ajax/market/app/api/event', data, res => {});
  }

  unload(workspace_id) {
    ws.unsubscribe('workspace_apps/' + workspace_id);
  }

  load(workspace_id, reset_offset, options) {
    if (!workspace_id) {
      return;
    }
    if (!options) {
      options = {};
    }

    var group_id = Collections.get('workspaces').find(workspace_id).group.id;

    if (!this.apps_by_group[group_id]) {
      this.apps_by_group[group_id] = {};
    }
    if (!this.apps_by_workspace[workspace_id]) {
      this.apps_by_workspace[workspace_id] = {};
    }

    ws.subscribe('workspace_apps/' + workspace_id, (route, res) => {
      this.recieveWS(res);
    });

    if (this.loading_by_workspace[workspace_id]) {
      return false;
    }

    this.loading_by_workspace[workspace_id] = true;
    this.notify();

    var data = {
      workspace_id: workspace_id,
    };

    var loadApps = data => {
      if (data.length > 0) {
        this.apps_by_workspace[data[0].workspace_id] = {};
      }

      data.forEach(item => {
        this.apps_by_workspace[item.workspace_id][item.app.id] = item.app;
        Collections.get('applications').updateObject(item.app);
      });

      this.did_first_load[workspace_id] = true;

      this.notify();
    };

    if (options.apps) {
      this.loading_by_workspace[workspace_id] = false;
      loadApps(options.apps);
    } else {
      Api.post('/ajax/workspace/apps/get', data, res => {
        if (res.data) {
          loadApps(res.data);
        }

        this.loading_by_workspace[workspace_id] = false;
      });
    }
  }

  loadGroupApps() {
    Api.post('/ajax/workspace/group/apps/get', { group_id: Groups.currentGroupId }, res => {
      if (res.data) {
        res.data.forEach(item => {
          var app_link = {
            workspace_count: item.workspace_count,
            workspace_default: item.workspace_default,
            app: item.app,
          };
          this.apps_by_group[item.group_id][item.app.id] = app_link;
        });

        this.notify();
      }
    });
  }

  recieveWS(res) {
    if (res.type === 'add') {
      var app_link = {
        workspace_count: res.workspace_app.workspace_count,
        workspace_default: res.workspace_app.workspace_default,
        app: res.workspace_app.app,
      };
      this.apps_by_workspace[res.workspace_app.workspace_id][res.workspace_app.app.id] =
        res.workspace_app.app;
      this.apps_by_group[res.workspace_app.group_id][res.workspace_app.app.id] = app_link;
      Collections.get('applications').completeObject(
        res.workspace_app.app,
        res.workspace_app.app.front_id,
      );
    } else if (res.type === 'remove') {
      delete this.apps_by_workspace[res.workspace_app.workspace_id][res.workspace_app.app.id];
    }
    this.notify();
  }

  activateApp(id) {
    var data = {
      workspace_id: Workspaces.currentWorkspaceId,
      app_id: id,
    };

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      this.apps_by_workspace[Workspaces.currentWorkspaceId][id] =
        this.apps_by_group[Groups.currentGroupId][id].app;
    }

    Api.post('/ajax/workspace/apps/enable', data, function (res) {});

    this.notify();
  }

  desactivateApp(id) {
    var data = {
      workspace_id: Workspaces.currentWorkspaceId,
      app_id: id,
    };

    if (this.apps_by_workspace[Workspaces.currentWorkspaceId]) {
      delete this.apps_by_workspace[Workspaces.currentWorkspaceId][id];
    }
    if (this.apps_by_group[Groups.currentGroupId]) {
      delete this.apps_by_group[Groups.currentGroupId][id];

      this.loadGroupApps();
    }

    Api.post('/ajax/workspace/apps/disable', data, function (res) {});

    this.notify();
  }

  forceInEntreprise(id) {
    var data = {
      group_id: Groups.currentGroupId,
      app_id: id,
    };

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      this.apps_by_workspace[Workspaces.currentWorkspaceId][id] =
        this.apps_by_group[Groups.currentGroupId][id].app;
    }

    Api.post('/ajax/workspace/group/application/force', data, function (res) {});

    this.notify();
  }

  forceRemoveFromEntreprise(id) {
    var data = {
      group_id: Groups.currentGroupId,
      app_id: id,
    };

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      delete this.apps_by_group[Groups.currentGroupId][id];
    }
    if (
      this.apps_by_workspace[Workspaces.currentWorkspaceId] &&
      this.apps_by_workspace[Workspaces.currentWorkspaceId][id]
    ) {
      delete this.apps_by_workspace[Workspaces.currentWorkspaceId][id];
    }

    Api.post('/ajax/workspace/group/application/remove', data, function (res) {});

    this.notify();
  }

  defaultForWorkspacesInEntreprise(id, state) {
    var data = {
      group_id: Groups.currentGroupId,
      app_id: id,
      state: state,
    };

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      this.apps_by_group[Groups.currentGroupId][id].workspace_default = state;
    }

    Api.post('/ajax/workspace/group/workspacedefault/set', data, function (res) {});

    this.notify();
  }

  openAppPopup(app_id) {}

  getAppIcon(app, feather = false) {
    if (app && app.simple_name) {
      switch (app.simple_name.toLocaleLowerCase()) {
        case 'twake_calendar':
          return feather ? Calendar : 'calendar-alt';
        case 'twake_drive':
          return feather ? Folder : 'folder';
        case 'twake_tasks':
          return feather ? CheckSquare : 'check-square';
        default:
          return app.icon_url || (feather ? Hexagon : 'puzzle-piece');
      }
    }
    return feather ? Hexagon : 'puzzle-piece';
  }

  getAppIconComponent(item, options = {}) {
    const application = DepreciatedCollections.get('applications').find(
      item.application_id ? item.application_id : item.id,
    );
    const IconType = this.getAppIcon(application, true);

    if (item.simple_name === 'jitsi') {
      return (
        <div
          className="menu-app-icon"
          style={item.icon_url ? { backgroundImage: 'url(' + item.icon_url + ')' } : {}}
        />
      );
    } else {
      if (typeof IconType === 'string') {
        return (
          <Icon
            type={IconType}
            style={{ width: options.size || 18, height: options.size || 18 }}
            className="small-right-margin"
          />
        );
      } else {
        return <IconType size={options.size || 18} className="small-right-margin" />;
      }
    }
  }
}

const workspaces = new WorkspacesApps();
export default workspaces;
