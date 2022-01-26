import React from 'react';
import Observable from 'app/services/Depreciated/observable.js';
import CurrentUser from 'app/deprecated/user/CurrentUser';
import Api from 'services/Api';
import ws from 'services/websocket.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Groups from './groups.js';
import Workspaces from './workspaces.js';
import Globals from 'services/Globals';
import Icon from 'app/components/icon/icon';
import { Folder, Calendar, CheckSquare, Hexagon } from 'react-feather';
import { getCompanyApplication as getApplication } from 'app/state/recoil/atoms/CompanyApplications';

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
          if (!this.apps_by_group) this.apps_by_group = {};
          if (!this.apps_by_group[item.group_id]) this.apps_by_group[item.group_id] = {};
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
    if (app && app?.identity?.code) {
      switch (app?.identity?.code.toLocaleLowerCase()) {
        case 'twake_calendar':
          return feather ? Calendar : 'calendar-alt';
        case 'twake_drive':
          return feather ? Folder : 'folder';
        case 'twake_tasks':
          return feather ? CheckSquare : 'check-square';
        default:
          return app.identity?.icon || (feather ? Hexagon : 'puzzle-piece');
      }
    }
    return feather ? Hexagon : 'puzzle-piece';
  }

  getAppIconComponent(item, options = {}) {
    const application = getApplication(item.application_id ? item.application_id : item.id);
    const IconType = this.getAppIcon(application, true);

    if (item.code === 'jitsi') {
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
