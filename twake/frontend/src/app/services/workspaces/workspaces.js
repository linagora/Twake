import React from 'react';
import Observable from 'app/services/Depreciated/observable.js';
import popupManager from 'services/popupManager/popupManager.js';
import PopupManager from 'services/popupManager/popupManager.js';
import User from 'services/user/user.js';
import Api from 'services/Api';
import ws from 'services/websocket.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Groups from 'services/workspaces/groups.js';
import LocalStorage from 'services/localStorage.js';
import workspacesUsers from './workspaces_users.js';
import WorkspaceUserRights from './workspace_user_rights.js';
import Notifications from 'services/user/notifications.js';
import WindowService from 'services/utils/window.js';
import Languages from 'services/languages/languages.js';
import workspacesApps from 'services/workspaces/workspaces_apps.js';
import RouterServices from 'app/services/RouterService';
import WelcomePage from 'scenes/Client/Popup/WelcomePage/WelcomePage';
import $ from 'jquery';

import Globals from 'services/Globals.js';
import JWTStorage from 'services/JWTStorage';

class Workspaces extends Observable {
  constructor() {
    super();
    Globals.window.workspaceService = this;

    this.setObservableName('workspaces');

    this.currentWorkspaceId = () => this.getCurrentWorkspaceId();
    this.currentWorkspaceIdByGroup = {};
    this.currentGroupId = null;

    this.user_workspaces = {};
    this.getting_details = {};
    this.showWelcomePage = false;
    this.loading = false;

    this.url_values = WindowService.getInfoFromUrl() || {};

    this.didFirstSelection = false;
  }

  updateCurrentWorkspaceId(workspaceId) {
    if (this.currentWorkspaceId != workspaceId && workspaceId) {
      this.currentWorkspaceId = workspaceId;
      const workspace = Collections.get('workspaces').find(workspaceId);
      if (workspace) this.currentWorkspaceIdByGroup[workspace.group.id] = workspaceId;

      if (!this.getting_details[workspaceId]) {
        this.getting_details[workspaceId] = true;

        workspacesApps.unload(this.currentWorkspaceId);
        Api.post('workspace/get', { workspaceId: workspaceId }, res => {
          if (res && res.data) {
            Collections.get('workspaces').updateObject(res.data);
            Collections.get('groups').updateObject(res.data.group);
            workspacesApps.load(workspaceId, false, { apps: res.data.apps });
          } else {
            this.removeFromUser(workspaceId);
          }
          setTimeout(() => {
            this.getting_details[workspaceId] = false;
          }, 10000);
        });
      }
    }
  }

  async initSelection() {
    if ((Globals.store_public_access_get_data || {}).public_access_token) {
      return;
    }

    let { workspaceId } = RouterServices.getStateFromRoute();
    const routerWorkspaceId = workspaceId;

    const autoload_workspaces = (await LocalStorage.getItem('autoload_workspaces')) || {};

    workspaceId = workspaceId || autoload_workspaces.id || '';

    let workspace = Collections.get('workspaces').find(workspaceId);
    if (!workspace) {
      workspace = Collections.get('workspaces').findBy({})[0];
      workspaceId = workspace?.id;
    }

    if (!routerWorkspaceId || !workspace) {
      if (
        !workspace ||
        Collections.get('users').known_objects_by_id[User.getCurrentUserId()]?.is_new
      ) {
        this.openWelcomePage();
      } else if (workspaceId !== this.currentWorkspaceId) {
        this.select(workspace, true);
      }
    }
    return;
  }

  openWelcomePage(page) {
    this.showWelcomePage = true;
    this.notify();
    popupManager.open(<WelcomePage />, false, 'workspace_parameters');
  }

  closeWelcomePage(forever) {
    if (forever) {
      Api.post('users/set/isNew', { value: false }, function (res) {});
      Collections.get('users').updateObject({
        id: User.getCurrentUserId(),
        isNew: false,
      });
    }
    this.showWelcomePage = false;
    popupManager.close();
    this.notify();
  }

  openCreateCompanyPage(page) {
    popupManager.open(page, this.user_workspaces.length > 0);
  }

  closeCreateCompanyPage() {
    popupManager.close();
  }

  closeCreateWorkspacePage() {
    popupManager.close();
  }

  changeGroup(group) {
    this.currentGroupId = group.id;
    this.notify();
    if (this.currentWorkspaceIdByGroup[group.id]) {
      this.select(this.user_workspaces[this.currentWorkspaceIdByGroup[group.id]]);
      return;
    }
    this.select(this.getOrderedWorkspacesInGroup(group.id)[0]);
  }

  select(workspace, replace = false) {
    if (!workspace) {
      return;
    }
    if (workspace.id === this.currentWorkspaceId) {
      return;
    }

    this.updateCurrentWorkspaceId(workspace.id);

    const route = RouterServices.generateRouteFromState({ workspaceId: workspace.id });
    if (replace) {
      RouterServices.history.replace(route);
    } else {
      RouterServices.history.push(route);
    }

    LocalStorage.setItem('autoload_workspaces', { id: workspace.id });

    this.notify();
  }

  addToUser(workspace) {
    var id = workspace.id;
    Collections.get('workspaces').updateObject(workspace);
    this.user_workspaces[id] = Collections.get('workspaces').known_objects_by_id[id];

    if (workspace._user_hasnotifications) {
      workspace.group._user_hasnotifications = true;
    }

    Notifications.updateBadge('workspace', workspace.id, workspace._user_hasnotifications ? 1 : 0);
  }

  removeFromUser(workspace) {
    if (!workspace) {
      return;
    }

    var id = workspace.id || workspace;
    delete this.user_workspaces[id];

    if (id == this.currentWorkspaceId) {
      this.initSelection(Groups.currentGroupId);
    }
  }

  getOrderedWorkspacesInGroup(group_id) {
    var object = [];
    Object.keys(this.user_workspaces)
      .sort((_a, _b) => {
        var a = this.user_workspaces[_a] || {};
        var b = this.user_workspaces[_b] || {};
        return (a.name || '').localeCompare(b.name || '');
      })
      .forEach(e => {
        var e = this.user_workspaces[e];
        if (!group_id || e?.group?.id == group_id) {
          object.push(e);
        }
      });
    return object;
  }

  createWorkspace(wsName, wsMembers, groupId, groupName, groupCreationData) {
    var that = this;
    var data = {
      name: wsName,
      groupId: groupId,
      group_name: groupName,
      group_creation_data: groupCreationData,
      channels: [
        {
          name: Languages.t('scenes.apps.calendar.event_edition.general_title', [], 'General'),
          icon: ':mailbox:',
        },
        { name: 'Random', icon: ':beach_umbrella:' },
      ],
    };
    that.loading = true;
    that.notify();
    var that = this;
    Api.post('workspace/create', data, function (res) {
      var group_id = undefined;
      var workspace = undefined;
      if (res.data && res.data.workspace) {
        that.addToUser(res.data.workspace);
        group_id = res.data.workspace.group.id;
        workspace = res.data.workspace;

        if (wsMembers.length > 0) {
          var data = {
            workspaceId: res.data.workspace.id,
            list: wsMembers.join(','),
            asExterne: false,
          };
          Api.post('workspace/members/addlist', data, () => {
            that.loading = false;
            popupManager.close();
            if (workspace) {
              that.select(workspace);
            } else {
              that.notify();
            }
          });
        } else {
          that.loading = false;
          popupManager.close();
          if (workspace) {
            that.select(workspace);
          } else {
            that.notify();
          }
        }
      }
      that.initSelection();
    });
  }

  updateWorkspaceName(name) {
    this.loading = true;
    this.notify();
    var that = this;
    Api.post(
      'workspace/data/name',
      { workspaceId: this.currentWorkspaceId, name: name },
      function (res) {
        if (res.errors.length == 0) {
          var update = {
            id: that.currentWorkspaceId,
            name: name,
          };
          Collections.get('workspaces').updateObject(update);
          ws.publish('workspace/' + update.id, { workspace: update });
        }
        that.loading = false;
        that.notify();
      },
    );
  }
  updateWorkspaceLogo(logo) {
    this.loading = true;
    this.notify();
    var route = Globals.window.api_root_url + '/ajax/' + 'workspace/data/logo';

    var data = new FormData();
    if (logo !== false) {
      data.append('logo', logo);
    } else {
      console.log('no logo');
    }
    data.append('workspaceId', this.currentWorkspaceId);
    var that = this;

    $.ajax({
      url: route,
      type: 'POST',
      data: data,
      cache: false,
      contentType: false,
      processData: false,

      headers: {
        Authorization: JWTStorage.getAutorizationHeader(),
      },
      xhrFields: {
        withCredentials: true,
      },
      xhr: function () {
        var myXhr = $.ajaxSettings.xhr();
        myXhr.onreadystatechange = function () {
          if (myXhr.readyState == XMLHttpRequest.DONE) {
            that.loading = false;
            var resp = JSON.parse(myXhr.responseText);
            if (resp.errors.indexOf('badimage') > -1) {
              that.error_identity_badimage = true;
              that.notify();
            } else {
              var update = resp.data;
              Collections.get('workspaces').updateObject(update);
              ws.publish('workspace/' + update.id, { workspace: update });
              that.notify();
            }
          }
        };
        return myXhr;
      },
    });
  }
  deleteWorkspace() {
    if (
      workspacesUsers.getUsersByWorkspace(this.currentWorkspaceId) &&
      (Object.keys(workspacesUsers.getUsersByWorkspace(this.currentWorkspaceId)) || []).filter(
        userId => !workspacesUsers.isExterne(userId),
      ).length > 1
    ) {
      this.errorDeleteWorkspaceMember = true;
      this.notify();
    } else if (this.currentWorkspaceId) {
      Api.post('workspace/delete', { workspaceId: this.currentWorkspaceId }, function (res) {
        PopupManager.close();
      });
    }
    window.location.reload();
  }

  getCurrentWorkspace() {
    return Collections.get('workspaces').find(this.currentWorkspaceId) || {};
  }
}

const workspaces = new Workspaces();
export default workspaces;
