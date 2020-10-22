import React from 'react';
import Languages from 'services/languages/languages.js';
import Observable from 'services/observable.js';
import popupManager from 'services/popupManager/popupManager.js';
import User from 'services/user/user.js';
import Api from 'services/api.js';
import ws from 'services/websocket.js';
import Collections from 'services/Collections/Collections.js';
import groupService from 'services/workspaces/groups.js';
import workspaceService from 'services/workspaces/workspaces.js';
import Numbers from 'services/utils/Numbers.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import CurrentUser from 'services/user/current_user.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import WorkspacesMembersTable from 'services/workspaces/workspaces_members_table';

import Globals from 'services/Globals.js';

class WorkspacesUsers extends Observable {
  constructor() {
    super();
    this.setObservableName('workspacesUsers');

    this.users_by_workspace = {};
    this.users_by_group = {};

    this.membersPending = [];

    this.updateRoleUserLoading = {};
    this.updateLevelUserLoading = {};

    this.offset_by_workspace_id = {};
    this.offset_by_group_id = {};

    this.loading = false;
    Globals.window.workspaceUserService = this;
  }
  getAdminLevel(idWorkspace = workspaceService.currentWorkspaceId) {
    var levels = Collections.get('workspaces').find(idWorkspace).levels;
    if (levels) {
      for (var i = 0; i < levels.length; i++) {
        if (levels[i].admin) {
          return levels[i];
        }
      }
    }
    return false;
  }
  getDefaultLevel(idWorkspace = workspaceService.currentWorkspaceId) {
    var levels = Collections.get('workspaces').find(idWorkspace).levels;
    if (levels) {
      for (var i = 0; i < levels.length; i++) {
        if (levels[i].default) {
          return levels[i];
        }
      }
    }
    return false;
  }
  isGroupManager() {}
  getLevel(idLevel) {
    var levels = Collections.get('workspaces').find(workspaceService.currentWorkspaceId).levels;
    for (var i = 0; i < levels.length; i++) {
      if (idLevel == levels[i].id) {
        return levels[i];
      }
    }
    return false;
  }

  getUsersByWorkspace(workspace_id) {
    return (this.users_by_workspace || {})[workspace_id] || {};
  }

  unload(workspace_id) {
    ws.unsubscribe('workspace_users/' + workspace_id);
  }

  load(workspace_id, reset_offset, options) {
    if (!options) {
      options = {};
    }

    var that = this;
    var workspace = Collections.get('workspaces').find(workspace_id);
    if (!workspace) {
      return;
    }
    var group_id = workspace.group.id;

    if (!this.users_by_group[group_id]) {
      this.users_by_group[group_id] = {};
    }
    if (!this.users_by_workspace[workspace_id]) {
      this.users_by_workspace[workspace_id] = {};
    }

    if (!this.offset_by_workspace_id[workspace_id] || reset_offset) {
      this.offset_by_workspace_id[workspace_id] = [0, false];
    }
    if (!this.offset_by_group_id[group_id] || reset_offset) {
      this.offset_by_group_id[group_id] = [0, false];
    }

    ws.subscribe('workspace_users/' + workspace_id, (route, res) => {
      this.recieveWS(res);
    });

    var loadMembers = data => {
      if (!data) {
        return;
      }
      if (typeof data.members === 'object' && data.members.members) {
        data = data.members;
      }
      if (data.members) {
        (data.members || []).forEach(item => {
          if (
            !that.offset_by_workspace_id[workspace_id][1] ||
            Numbers.compareTimeuuid(item.user.id, that.offset_by_workspace_id[workspace_id][1]) > 0
          ) {
            that.offset_by_workspace_id[workspace_id][1] = item.user.id;
          }
          that.offset_by_workspace_id[workspace_id][0]++;

          Collections.get('users').completeObject(item.user, item.user.front_id);

          that.users_by_group[group_id][item.user.id] = item;
          that.users_by_workspace[workspace_id][item.user.id] = item;
        });
        that.notify();
      }

      if (data.mails) {
        that.membersPending = data.mails || [];
        that.notify();
      }

      if (data.total_members > 1 && WorkspaceUserRights.hasWorkspacePrivilege()) {
        CurrentUser.updateTutorialStatus('did_invite_collaborators');
      }
    };

    var data = {
      workspaceId: workspace_id,
      max: this.offset_by_workspace_id[workspace_id][0] == 0 ? 100 : 40,
    };

    if (options.members) {
      loadMembers(options.members || []);
    } else {
      Api.post('workspace/members/list', data, res => {
        if (res.data) {
          loadMembers({ members: res.data });
        }
      });
      Api.post('workspace/members/pending', data, res => {
        if (res.data) {
          loadMembers({ mails: res.data });
        }
      });
      loadMembers(options.members || []);
    }

    var loadGroupUsers = data => {
      data.users.forEach(item => {
        if (
          !that.offset_by_group_id[group_id][1] ||
          Numbers.compareTimeuuid(item.user.id, that.offset_by_group_id[group_id][1]) > 0
        ) {
          that.offset_by_group_id[group_id][1] = item.user.id;
        }
        that.offset_by_group_id[group_id][0]++;

        Collections.get('users').completeObject(item.user, item.user.front_id);

        that.users_by_group[group_id][item.user.id] = item;
      });
      that.notify();
    };

    if (options.group_users) {
      loadMembers(options.group_users);
    }
  }
  canShowUserInWorkspaceList(member) {
    // if user is interne or wexterne => no restriction
    if (!WorkspaceUserRights.isInvite() || !WorkspaceUserRights.isInviteChannelOnly()) {
      return true;
    } else {
      if (
        !WorkspaceUserRights.isInvite(member) ||
        !WorkspaceUserRights.isInviteChannelOnly(member)
      ) {
        // if other user is interne or wexterne
        return true;
      }

      // check in all channel if 2 chavite are in the same channel
      const channelsInWorkspace = Collections.get('channels').findBy({
        direct: false,
        application: false,
        original_workspace: workspaceService.currentWorkspaceId,
      });
      for (var i = 0; i < channelsInWorkspace.length; i++) {
        // check in all channel if 2 chavite are in the same channel
        if (channelsInWorkspace[i].ext_members) {
          let bothAreInChannel = 0; // if 1 : one of 2 users searched is in channel as chavite, 2 : both are in channel as chavite
          const extMembers = channelsInWorkspace[i].ext_members;
          for (var j = 0; j < extMembers.length; j++) {
            if (extMembers[j] == member || extMembers[j] == CurrentUser.get().id) {
              bothAreInChannel++;
              if (bothAreInChannel >= 2) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }
  removeUserFromWorkspaceList(user) {}
  recieveWS(res) {
    if (res.type == 'add' || res.type == 'update_workspace_level') {
      var userlink = {
        externe: res.workspace_user.externe,
        autoAddExterne: res.workspace_user.auto_add_externe,
        last_access: res.workspace_user.last_access,
        level: res.workspace_user.level_id,
        user: res.workspace_user.user,
        groupLevel: res.workspace_user.groupLevel,
      };
      this.users_by_workspace[res.workspace_user.workspace.id][
        res.workspace_user.user.id
      ] = userlink;
      this.users_by_group[res.workspace_user.workspace.group.id][
        res.workspace_user.user.id
      ] = userlink;
      WorkspacesMembersTable.updateElement(
        res.workspace_user.workspace.id,
        'members',
        res.workspace_user.user.id,
        res.workspace_user,
      );
      // Collections.get("users").completeObject(res.workspace_user.user, res.workspace_user.user.front_id);
    } else if (res.type == 'remove') {
      WorkspacesMembersTable.removeElement(
        res.workspace_user.workspace.id,
        'members',
        res.workspace_user.user.id,
      );
      if (res.workspace_user.nbWorkspace <= 0) {
        delete this.users_by_group[res.workspace_user.workspace.group.id][
          res.workspace_user.user.id
        ];
      }
    }
    this.notify();
  }

  removeUser(id, workspaceId, cb) {
    const openedWorkspaceId = workspaceService.currentWorkspaceId;
    var that = this;
    this.loading = true;
    this.notify();

    Api.post('workspace/members/remove', { ids: [id], workspaceId: workspaceId }, function (res) {
      if (id == CurrentUser.get().id && openedWorkspaceId == workspaceId) {
        Globals.window.location.reload();
      }

      WorkspacesMembersTable.removeElement(workspaceId, 'members', id);

      that.loading = false;
      that.notify();
      if (cb) {
        cb();
      }
    });
  }
  addUser(mails, cb, thot) {
    var that = this;
    this.loading = true;
    this.notify();

    Api.post(
      'workspace/members/addlist',
      {
        list: mails.join(';'),
        workspaceId: workspaceService.currentWorkspaceId,
      },
      function (res) {
        if (res.errors.length == 0) {
          if (
            ((res.data.added || {}).pending || []).length +
              ((res.data.added || {}).user || []).length >
            0
          ) {
            CurrentUser.updateTutorialStatus('did_invite_collaborators');
          }

          ((res.data.added || {}).user || []).forEach(() => {
            if (Globals.window.mixpanel_enabled)
              Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Add Collaborator', {
                workspace_id: workspaceService.currentWorkspaceId,
              });
          });

          res.data.added.pending.forEach(mail => {
            if (Globals.window.mixpanel_enabled)
              Globals.window.mixpanel.track(Globals.window.mixpanel_prefix + 'Add Collaborator', {
                workspace_id: workspaceService.currentWorkspaceId,
              });

            WorkspacesMembersTable.updateElement(res.workspaceId, 'pending', res.mail, {
              mail: mail,
            });
          });
          that.errorOnInvitation = false;
          that.errorUsersInvitation = [];
          if (res.data.not_added.length > 0) {
            if (res.data.not_added[0] != '') {
              that.errorOnInvitation = true;
              that.errorUsersInvitation = res.data.not_added;
            }
            AlertManager.alert(() => {}, {
              text:
                Languages.t(
                  'services.workspaces.not_added',
                  [],
                  "Les utilisateurs suivants n'ont pas été ajoutés (déjà invité, email mal formatté, ou utilisateur inconnu) : ",
                ) + (res.data.not_added || []).join(', '),
            });
          }
        }
        that.loading = false;
        that.notify();
        if (cb) {
          cb(thot);
        }
      },
    );
  }
  addUserFromGroup(id, externe, cb, thot) {
    if (this.users_by_group[groupService.currentGroupId][id]) {
      this.users_by_workspace[workspaceService.currentWorkspaceId][id] = this.users_by_group[
        groupService.currentGroupId
      ][id];
      var username = (Collections.get('users').find(id) || {}).username || '';
      this.addUser([username + '|' + (externe ? 1 : 0)], cb, thot);
      this.notify();
    }
  }
  removeInvitation(mail, cb) {
    var that = this;
    this.loading = true;
    var index = that.membersPending
      .map(function (e) {
        return e.mail;
      })
      .indexOf(mail);
    if (index >= 0) {
      var old = that.membersPending.splice(index, 1);
    }
    this.notify();
    Api.post(
      'workspace/members/removemail',
      {
        workspaceId: workspaceService.currentWorkspaceId,
        mail: mail,
      },
      function (res) {
        WorkspacesMembersTable.removeElement(workspaceService.currentWorkspaceId, 'pending', mail);
        that.loading = false;
        that.notify();
        if (cb) {
          cb();
        }
      },
    );
  }
  isExterne(userIdOrMail, workspaceId = null) {
    if (!workspaceId) {
      workspaceId = workspaceService.currentWorkspaceId;
    }
    if (userIdOrMail.indexOf('@') > 0) {
      //c'est un mail
      return true;
    } else {
      return (
        this.users_by_workspace[workspaceId] &&
        this.users_by_workspace[workspaceId][userIdOrMail] &&
        this.users_by_workspace[workspaceId][userIdOrMail].externe
      );
    }
  }

  isAutoAddUser(userId, workspaceId = null) {
    if (!workspaceId) {
      workspaceId = workspaceService.currentWorkspaceId;
    }
    var user = (this.users_by_workspace[workspaceId] || {})[userId];
    if (user) {
      return user.externe && user.autoAddExterne;
    }
    return false;
  }

  updateManagerRole(userId, state) {
    var workspaceId = workspaceService.currentWorkspaceId;
    var groupId = groupService.currentGroupId;
    const member = WorkspacesMembersTable.getElement(workspaceId, 'members', userId);
    if (member && !this.updateRoleUserLoading[userId]) {
      var that = this;
      this.updateRoleUserLoading[userId] = true;
      var previousState = member.groupLevel;
      member.groupLevel = state ? 3 : -1;
      WorkspacesMembersTable.updateElement(workspaceId, 'members', userId, member);
      this.notify();
      Api.post(
        'workspace/group/manager/toggleManager',
        { groupId: groupId, userId: userId, isManager: state },
        res => {
          if (res.errors.length > 0) {
            member.groupLevel = previousState;
            WorkspacesMembersTable.updateElement(workspaceId, 'members', userId, member);
          }
          that.updateRoleUserLoading[userId] = false;
          that.notify();
        },
      );
    } else if (member && !this.updateRoleUserLoading[userId]) {
      var that = this;
      this.updateRoleUserLoading[userId] = true;
      var previousState = member.groupLevel;
      member.level = state ? 3 : -1;
      WorkspacesMembersTable.updateElement(workspaceId, 'members', userId, member);
      this.notify();
      Api.post(
        'workspace/group/manager/toggleManager',
        { groupId: groupId, userId: userId, isManager: state },
        res => {
          if (res.errors.length > 0) {
            member.level = previousState;
            WorkspacesMembersTable.updateElement(workspaceId, 'members', userId, member);
          }
          that.updateRoleUserLoading[userId] = false;
          that.notify();
        },
      );
    }
  }
  updateUserLevel(userId, state) {
    var workspaceId = workspaceService.currentWorkspaceId;
    const member = WorkspacesMembersTable.getElement(workspaceId, 'members', userId);
    if (member && !this.updateRoleUserLoading[userId]) {
      var that = this;
      this.updateLevelUserLoading[userId] = true;
      var previousState = member.level;
      if (previousState == this.getDefaultLevel().id) {
        member.level = this.getAdminLevel().id;
      } else {
        member.level = this.getDefaultLevel().id;
      }
      WorkspacesMembersTable.updateElement(workspaceId, 'members', userId, member);
      this.notify();
      Api.post(
        'workspace/members/changelevel',
        {
          workspaceId: workspaceService.currentWorkspaceId,
          usersId: [userId],
          levelId: member.level,
        },
        res => {
          if (res.errors.length > 0 || res.data.updated == 0) {
            console.log('error, going to previous state' + previousState);
            member.level = previousState;
            WorkspacesMembersTable.updateElement(workspaceId, 'members', userId, member);
          }
          that.updateLevelUserLoading[userId] = false;
          that.notify();
        },
      );
    }
  }

  searchUserInWorkspace(query, cb) {
    User.search(
      query,
      { scope: 'workspace', workspace_id: workspaceService.currentWorkspaceId },
      results => {
        cb(results);
      },
    );
  }

  leaveWorkspace() {
    var that = this;
    var has_other_admin = false;
    if (!WorkspaceUserRights.hasWorkspacePrivilege()) {
      has_other_admin = true;
    } else {
      var users = WorkspacesMembersTable.getList(workspaceService.currentWorkspaceId, 'members');
      Object.keys(users).forEach(id => {
        if (
          id != User.getCurrentUserId() &&
          users[id].level == users[User.getCurrentUserId()].level
        ) {
          has_other_admin = true;
        }
      });
    }
    if (has_other_admin) {
      AlertManager.confirm(() => {
        try {
          that.removeUser(User.getCurrentUserId(), workspaceService.currentWorkspaceId);
          workspaceService.removeFromUser(
            Collections.get('workspaces').find(workspaceService.currentWorkspaceId),
          );
        } catch (err) {
          console.log(err);
        }
      });
    } else {
      AlertManager.alert(() => {}, {
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.alert_impossible_removing',
          [],
          "Impossible de quitter l'espace de travail car vous êtes le dernier administrateur. Vous pouvez définir un nouvel administrateur ou bien supprimer / archiver cet espace de travail.",
        ),
      });
    }
  }
}

const service = new WorkspacesUsers();
export default service;
