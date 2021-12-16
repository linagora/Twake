import React from 'react';
import $ from 'jquery';
import Observable from 'app/services/Depreciated/observable.js';
import popupManager from 'services/popupManager/popupManager.js';
import PopupManager from 'services/popupManager/popupManager.js';
import Api from 'services/Api';
import ws from 'services/websocket.js';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';
import Groups from 'services/workspaces/groups.js';
import LocalStorage from 'app/services/LocalStorage';
import workspacesUsers from './workspaces_users.ts';
import WindowService from 'services/utils/window';
import workspacesApps from 'services/workspaces/workspaces_apps.js';
import RouterServices from 'app/services/RouterService';
import NoWorkspaces from 'app/scenes/Client/WorkspacesBar/Components/NoWorkspaces/NoWorkspaces';
import NoCompanies from 'app/scenes/Client/WorkspacesBar/Components/NoWorkspaces/NoCompanies';
import loginService from 'app/services/login/LoginService';
import Globals from 'services/Globals';
import JWTStorage from 'services/JWTStorage';
import ConsoleService from 'services/Console/ConsoleService';
import WorkspaceAPIClient from './WorkspaceAPIClient';
import Logger from 'services/Logger';

class Workspaces extends Observable {
  constructor() {
    super();
    Globals.window.workspaceService = this;

    this.setObservableName('workspaces');
    this.logger = Logger.getLogger('services/Workspaces');

    this.currentWorkspaceId = '';
    this.currentWorkspaceIdByGroup = {};
    this.currentGroupId = null;

    this.user_workspaces = {};
    this.getting_details = {};
    this.showNoWorkspacesPage = false;
    this.showNoCompaniesPage = false;
    this.loading = false;

    this.url_values = WindowService.getInfoFromUrl() || {};

    this.didFirstSelection = false;
  }

  updateCurrentWorkspaceId(workspaceId, notify = false) {
    console.log('updateCurrentWorkspaceId', workspaceId, this.currentWorkspaceId);
    if (this.currentWorkspaceId !== workspaceId && workspaceId) {
      const workspace = DepreciatedCollections.get('workspaces').find(workspaceId);
      if (!workspace) {
        return;
      }
      console.log('updateCurrentWorkspaceId B', workspaceId);

      this.currentWorkspaceId = workspaceId;
      this.currentWorkspaceIdByGroup[workspace.company_id] = workspaceId;

      if (!this.getting_details[workspaceId]) {
        this.getting_details[workspaceId] = true;

        workspacesApps.unload(this.currentWorkspaceId);
        WorkspaceAPIClient.get(workspace.company_id, workspaceId)
          .then(workspace => {
            if (!workspace) {
              this.removeFromUser(workspaceId);
            }
            DepreciatedCollections.get('workspaces').updateObject(workspace);
            // FIXME: Is it useful?
            //DepreciatedCollections.get('groups').updateObject(res.data.group);
            notify && this.notify();

            // FIXME: What is this???
            setTimeout(() => {
              this.getting_details[workspaceId] = false;
            }, 10000);
          })
          .catch(() => {
            this.removeFromUser(workspaceId);
          });
      }
    }
  }

  updateCurrentCompanyId(companyId, notify = false) {
    if (this.currentGroupId !== companyId && companyId) {
      Groups.currentGroupId = companyId;
      this.currentGroupId = companyId;
      notify && this.notify();
    }
  }

  openNoWorkspacesPage() {
    this.showNoWorkspacesPage = true;
    this.notify();
    popupManager.open(<NoWorkspaces />, false, 'no_workspace_parameters');
  }

  closeNoWorkspacesPage() {
    this.showNoWorkspacesPage = false;
    popupManager.close();
    this.notify();
  }

  openNoCompaniesPage() {
    this.showNoCompaniesPage = true;
    this.notify();
    popupManager.open(<NoCompanies />, false, 'no_companies_parameters');
  }

  closeNoCompaniesPage() {
    this.showNoCompaniesPage = false;
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
    this.updateCurrentCompanyId(group.id);
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

    const route = RouterServices.generateRouteFromState({
      companyId: workspace.company_id,
      workspaceId: workspace.id,
      channelId: '',
    });
    if (replace) {
      RouterServices.replace(route);
    } else {
      RouterServices.push(route);
    }

    LocalStorage.setItem(`default_workspace_id_${workspace.company_id}`, workspace.id);

    this.notify();
  }

  removeFromUser(workspace) {
    if (!workspace) {
      return;
    }

    var id = workspace.id || workspace;
    delete this.user_workspaces[id];
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
        // eslint-disable-next-line no-redeclare
        var e = this.user_workspaces[e];
        if (!group_id || e?.company_id === group_id) {
          object.push(e);
        }
      });
    return object;
  }

  async createWorkspace(wsName, wsMembers, groupId, groupName, groupCreationData) {
    var that = this;
    that.loading = true;
    that.notify();
    const res = await WorkspaceAPIClient.create(groupId, {
      name: wsName,
      logo: '',
      default: false,
    });
    var workspace = res;
    if (workspace) {
      //Update rights and more
      loginService.updateUser();
      if (wsMembers.length > 0) {
        //Invite using console
        ConsoleService.addMailsInWorkspace({
          workspace_id: workspace.id || '',
          company_id: workspace?.group?.id || workspace.company_id || '',
          emails: wsMembers,
        }).finally(() => {
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
  }

  async updateWorkspaceName(name) {
    this.loading = true;
    this.notify();

    try {
      const result = await WorkspaceAPIClient.update(this.currentGroupId, this.currentWorkspaceId, {
        name,
      });
      this.logger.debug('Workspace updated', result);
      DepreciatedCollections.get('workspaces').updateObject({
        id: this.currentWorkspaceId,
        name,
      });
    } catch (err) {
      this.logger.error('Can not update the workspace', err);
    }
    this.loading = false;
    this.notify();
  }

  updateWorkspaceLogo(logo) {
    this.loading = true;
    this.notify();
    var route = `${Globals.api_root_url}/ajax/workspace/data/logo`;

    var data = new FormData();
    if (logo !== false) {
      data.append('logo', logo);
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
          if (myXhr.readyState === XMLHttpRequest.DONE) {
            that.loading = false;
            var resp = JSON.parse(myXhr.responseText);
            if (resp.errors.indexOf('badimage') > -1) {
              that.error_identity_badimage = true;
              that.notify();
            } else {
              var update = resp.data;
              DepreciatedCollections.get('workspaces').updateObject(update);
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
      (Object.keys(workspacesUsers.getUsersByWorkspace(this.currentWorkspaceId)) || []).length > 1
    ) {
      this.errorDeleteWorkspaceMember = true;
      this.notify();
    } else if (this.currentWorkspaceId) {
      Api.post('/ajax/workspace/delete', { workspaceId: this.currentWorkspaceId }, function (res) {
        PopupManager.close();
      });
    }
    window.location.reload();
  }

  getCurrentWorkspace() {
    return DepreciatedCollections.get('workspaces').find(this.currentWorkspaceId) || {};
  }
}

export default new Workspaces();
