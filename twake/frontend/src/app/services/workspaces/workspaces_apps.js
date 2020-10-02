import React from 'react';
import Observable from 'services/observable.js';
import CurrentUser from 'services/user/current_user.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import Groups from './groups.js';
import Workspaces from './workspaces.js';
import Globals from 'services/Globals.js';

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
    return (
      Object.keys(this.apps_by_workspace[Workspaces.currentWorkspaceId] || {}).map(
        id => this.apps_by_workspace[Workspaces.currentWorkspaceId][id],
      ) || []
    );
  }

  getApp(id, callback = undefined) {
    if (this.findingApp[id]) {
      return;
    }

    this.findingApp[id] = true;

    Api.post('market/app/find', { id: id }, res => {
      if (res.data) {
        Collections.get('applications').updateObject(res.data);
        this.findingApp[id] = false;
        if (callback) callback();
      }
    });
  }

  notifyApp(app_id, type, event, data, workspace_id = undefined, group_id = undefined) {
    workspace_id = workspace_id || Workspaces.currentWorkspaceId;
    group_id = group_id || Workspaces.currentGroupId;

    data.connection_id = CurrentUser.unique_connection_id;

    var data = {
      workspace_id: workspace_id,
      group_id: group_id,
      app_id: app_id,
      type: type,
      event: event,
      data: data,
    };

    Api.post('market/app/api/event', data, res => {});
  }

  unload(workspace_id) {
    ws.unsubscribe('workspace_apps/' + workspace_id);
  }

  load(workspace_id, reset_offset, options) {
    if (!options) {
      options = {};
    }

    var that = this;
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
      Api.post('workspace/apps/get', data, res => {
        if (res.data) {
          loadApps(res.data);
        }

        this.loading_by_workspace[workspace_id] = false;
      });
    }
  }

  loadGroupApps() {
    Api.post('workspace/group/apps/get', { group_id: Groups.currentGroupId }, res => {
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
    if (res.type == 'add') {
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
    } else if (res.type == 'remove') {
      delete this.apps_by_workspace[res.workspace_app.workspace_id][res.workspace_app.app.id];
    }
    this.notify();
  }

  activateApp(id) {
    var data = {
      workspace_id: Workspaces.currentWorkspaceId,
      app_id: id,
    };
    var that = this;

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      this.apps_by_workspace[Workspaces.currentWorkspaceId][id] = this.apps_by_group[
        Groups.currentGroupId
      ][id].app;
    }

    if (Globals.window.mixpanel_enabled)
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Activate App', { id: id });

    Api.post('workspace/apps/enable', data, function (res) {});

    this.notify();
  }

  desactivateApp(id) {
    var data = {
      workspace_id: Workspaces.currentWorkspaceId,
      app_id: id,
    };
    var that = this;

    if (this.apps_by_workspace[Workspaces.currentWorkspaceId]) {
      delete this.apps_by_workspace[Workspaces.currentWorkspaceId][id];
    }
    if (this.apps_by_group[Groups.currentGroupId]) {
      delete this.apps_by_group[Groups.currentGroupId][id];

      this.loadGroupApps();
    }

    if (Globals.window.mixpanel_enabled)
      Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Remove App', { id: id });

    Api.post('workspace/apps/disable', data, function (res) {});

    this.notify();
  }

  forceInEntreprise(id) {
    var data = {
      group_id: Groups.currentGroupId,
      app_id: id,
    };
    var that = this;

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      this.apps_by_workspace[Workspaces.currentWorkspaceId][id] = this.apps_by_group[
        Groups.currentGroupId
      ][id].app;
    }

    Api.post('workspace/group/application/force', data, function (res) {});

    this.notify();
  }

  forceRemoveFromEntreprise(id) {
    var data = {
      group_id: Groups.currentGroupId,
      app_id: id,
    };
    var that = this;

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

    Api.post('workspace/group/application/remove', data, function (res) {});

    this.notify();
  }

  defaultForWorkspacesInEntreprise(id, state) {
    var data = {
      group_id: Groups.currentGroupId,
      app_id: id,
      state: state,
    };
    var that = this;

    if (
      this.apps_by_group[Groups.currentGroupId] &&
      this.apps_by_group[Groups.currentGroupId][id]
    ) {
      this.apps_by_group[Groups.currentGroupId][id].workspace_default = state;
    }

    Api.post('workspace/group/workspacedefault/set', data, function (res) {});

    this.notify();
  }

  openAppPopup(app_id) {
    //TODO
    console.log('Open App Popup loader waiting for content');
  }

  getAppIcon(app) {
    if (app.simple_name.toLocaleLowerCase() == 'twake_calendar') {
      return 'calendar-alt';
    }
    if (app.simple_name.toLocaleLowerCase() == 'twake_drive') {
      return 'folder';
    }
    if (app.simple_name.toLocaleLowerCase() == 'twake_tasks') {
      return 'check-square';
    }
    return app.icon_url || 'puzzle-piece';
  }
}

const workspaces = new WorkspacesApps();
export default workspaces;
