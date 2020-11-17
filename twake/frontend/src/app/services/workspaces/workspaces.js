import React from 'react';
import Observable from 'services/observable.js';
import popupManager from 'services/popupManager/popupManager.js';
import PopupManager from 'services/popupManager/popupManager.js';
import User from 'services/user/user.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import Groups from 'services/workspaces/groups.js';
import LocalStorage from 'services/localStorage.js';
import workspacesUsers from './workspaces_users.js';
import WorkspaceUserRights from './workspace_user_rights.js';
import Notifications from 'services/user/notifications.js';
import WindowService from 'services/utils/window.js';
import Languages from 'services/languages/languages.js';
import workspacesApps from 'services/workspaces/workspaces_apps.js';
import $ from 'jquery';

import Globals from 'services/Globals.js';

class Workspaces extends Observable {
  constructor() {
    super();
    Globals.window.workspaceService = this;

    this.setObservableName('workspaces');
    this.currentWorkspaceId = null;
    this.currentWorkspaceIdByGroup = {};
    this.currentGroupId = null;

    this.user_workspaces = {};
    this.getting_details = {};
    this.showWelcomePage = false;
    this.loading = false;

    this.welcomePage = '';

    this.url_values = WindowService.getInfoFromUrl() || {};

    this.didFirstSelection = false;
  }

  setWelcomePage(page) {
    this.welcomePage = page;
  }

  initSelection(group_id) {
    if ((Globals.store_public_access_get_data || {}).public_access_token) {
      return;
    }

    if (!Object.keys(this.user_workspaces).length) {
      this.openWelcomePage(this.welcomePage);
      return;
    }

    LocalStorage.getItem('autoload_workspaces', autoload_workspaces => {
      this.didFirstSelection = true;

      var workspace =
        (this.url_values.workspace_id ? { id: this.url_values.workspace_id } : null) ||
        autoload_workspaces ||
        {};

      if (
        workspace.id &&
        this.user_workspaces[workspace.id] &&
        (!group_id || (workspace.group && workspace.group.id == group_id))
      ) {
        this.select(this.user_workspaces[workspace.id]);
      } else {
        //Search best workspace for user
        var firstWorkspace = this.getOrderedWorkspacesInGroup(group_id);

        if (firstWorkspace.length == 0) {
          firstWorkspace = this.getOrderedWorkspacesInGroup();
        }

        if (firstWorkspace.length == 0) {
          //No workspaces for current user or new user
          this.openWelcomePage(this.welcomePage);
          return;
        }

        firstWorkspace = firstWorkspace[0];
        this.select(firstWorkspace);
      }

      if (Collections.get('users').known_objects_by_id[User.getCurrentUserId()].is_new) {
        this.openWelcomePage(this.welcomePage);
      }
    });
  }

  openWelcomePage(page) {
    this.showWelcomePage = true;
    this.notify();
    popupManager.open(page, false, 'workspace_parameters');
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
    this.initSelection(group.id);
  }

  select(workspace) {
    if (!this.didFirstSelection) {
      return;
    }

    if (this.currentWorkspaceId == workspace.id) {
      return;
    }

    if (workspace.id && !Collections.get('workspaces').find(workspace.id)) {
      setTimeout(() => {
        this.initSelection();
      }, 1000);
      return;
    }

    workspacesUsers.unload(this.currentWorkspaceId);
    workspacesApps.unload(this.currentWorkspaceId);

    if (!this.getting_details[workspace.id]) {
      this.getting_details[workspace.id] = true;

      Api.post('workspace/get', { workspaceId: workspace.id }, res => {
        if (res && res.data) {
          Collections.get('workspaces').updateObject(res.data);
          Collections.get('groups').updateObject(res.data.group);

          WorkspaceUserRights.currentUserRightsByWorkspace[res.data.id] = res.data.user_level || {};
          WorkspaceUserRights.currentUserRightsByGroup[res.data.group.id] =
            res.data.group.level || [];
          WorkspaceUserRights.notify();
          workspacesUsers.load(workspace.id, false, { members: res.data.members || [] });
          workspacesApps.load(workspace.id, false, { apps: res.data.apps });
        } else {
          this.removeFromUser(workspace);
        }
        setTimeout(() => {
          this.getting_details[workspace.id] = false;
        }, 10000);
      });
    }

    this.currentWorkspaceId = workspace.id;
    this.currentWorkspaceIdByGroup[workspace.group.id] = workspace.id;

    LocalStorage.setItem('autoload_workspaces', { id: workspace.id });

    Groups.select(Collections.get('groups').known_objects_by_id[workspace.group.id]);

    this.notify();
  }

  addToUser(workspace) {
    var id = workspace.id;
    Collections.get('workspaces').updateObject(workspace);
    this.user_workspaces[id] = Collections.get('workspaces').known_objects_by_id[id];

    if (workspace._user_hasnotifications) {
      workspace.group._user_hasnotifications = true;
    }

    Groups.addToUser(workspace.group);
    if (
      (this.showWelcomePage && this.loading) ||
      !this.currentGroupId ||
      !this.currentWorkspaceId
    ) {
      this.loading = false;
      this.showWelcomePage = false;
      this.notify();
      this.select(workspace);
    }

    Notifications.updateBadge('workspace', workspace.id, workspace._user_hasnotifications ? 1 : 0);
  }

  removeFromUser(workspace) {
    if (!workspace) {
      return;
    }

    var id = workspace.id;
    delete this.user_workspaces[id];

    if (id == this.currentWorkspaceId) {
      this.initSelection(Groups.currentGroupId);
    }
  }

  getOrderedWorkspacesInGroup(group_id, no_filter) {
    var object = [];
    var that = this;
    Object.keys(this.user_workspaces).forEach(function (e) {
      if (no_filter) {
        object.push(e);
        return;
      }
      var favoris = 0;
      var e = that.user_workspaces[e];
      if (!group_id || e.group.id == group_id) {
        if (
          (!that.searchQuery &&
            (that.currentWorkspaceId == e.id ||
              !e.isHidden)) /* || Notifications.notifications[e.id] && Notifications.notifications[e.id].total > 0 */ ||
          (that.searchQuery && that.testSearch(e))
        ) {
          object.push(e);
        }
        if (e.isFavorite) {
          favoris = 1;
        }
      }
      e['favoris'] = favoris;
    });
    object = object.sort(function (a, b) {
      if (a.favoris != b.favoris) {
        return b.favoris - a.favoris;
      }
      return String(a.name).localeCompare(String(b.name));
    });

    if (object.length == 0 && !no_filter) {
      return this.getOrderedWorkspacesInGroup(group_id, true);
    }

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
    Api.post('workspace/data/name', { workspaceId: this.currentWorkspaceId, name: name }, function (
      res,
    ) {
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
    });
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

    Globals.getAllCookies(cookies => {
      $.ajax({
        url: route,
        type: 'POST',
        data: data,
        cache: false,
        contentType: false,
        processData: false,

        headers: {
          'All-Cookies': JSON.stringify(cookies),
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
