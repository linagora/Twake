import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import groupService from 'services/workspaces/groups.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import Menu from 'components/Menus/Menu.js';
import AlertManager from 'services/AlertManager/AlertManager';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch.js';
import workspaceUserRightsService from 'services/workspaces/workspace_user_rights.js';
import UserService from 'services/user/user.js';
import CreateCompanyAccount from './CreateCompanyAccount.js';
import MediumPopupManager from 'app/components/Modal/ModalManager';
import './Pages.scss';
import Pending from 'app/scenes/Client/Popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Pending.js';
import Members from 'app/scenes/Client/Popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Members.js';
import Tabs from 'components/Tabs/Tabs.js';
import InitService from 'app/services/InitService';
import ConsoleService from 'app/services/ConsoleService';

export default class WorkspacePartner extends Component {
  constructor() {
    super();
    var workspace = Collections.get('workspaces').find(WorkspaceService.currentWorkspaceId);
    this.state = {
      i18n: Languages,
      workspace: Collections.get('workspaces'),
      WorkspaceService: WorkspaceService,
      attributeOpen: 0,
      subMenuOpened: 0,
      workspaceName: workspace ? workspace.name : '',
      groupName: workspace ? workspace.group.name : '',
      workspaceLogo: false,
      workspacesUsers: workspacesUsers,
      addOpen: false,
      members: [],
      asExterne: false,
      collaborators: 0,
      input_to_show: 2,
      workspaceUserRightsService: workspaceUserRightsService,
    };
    this.inputWorkspaceName = null;
    Collections.get('workspaces').addListener(this);
    WorkspaceService.addListener(this);
    workspacesUsers.addListener(this);
    workspaceUserRightsService.addListener(this);
    Languages.addListener(this);
  }
  componentWillMount() {
    this.state.workspaceLogo = false;
  }
  componentWillUnmount() {
    Collections.get('workspaces').removeListener(this);
    WorkspaceService.removeListener(this);
    workspacesUsers.removeListener(this);
    workspaceUserRightsService.removeListener(this);
    Languages.removeListener(this);
  }
  onChangeMail(e, member_index) {
    this.state.members[member_index].mail = e.target.value;

    var that = this;
    that.state.collaborators = 0;
    var notEmpty = false;
    this.state.members.forEach(function (member, i) {
      if (member.mail.length > 0) {
        notEmpty = true;
        that.state.input_to_show = i + 1;
        that.state.collaborators++;
      }
    });
    if (!notEmpty) {
      that.state.input_to_show = 1;
    }
    this.state.input_to_show = Math.max(2, this.state.input_to_show + 1);
    this.setState({});
  }
  confirmIfMe(id, options, callback) {
    if (id == UserService.getCurrentUserId()) {
      AlertManager.confirm(callback, () => {}, options);
    } else {
      callback();
    }
  }
  buildMenu(col, company) {
    var menu = [];
    var subMenu = [];
    var adminLevelId = workspacesUsers.getAdminLevel().id;

    var bloc_edit_group_manager = (InitService.server_infos?.configuration?.account?.type !==
      'console' && [
      {
        type: 'react-element',
        text: '',
        icon: 'edit',
        reactElement: () => (
          <div className="editLevel">
            <Switch
              disabled={workspacesUsers.updateRoleUserLoading[col.user.id]}
              label={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.company_manager_label',
                [],
                "Gérant de l'entreprise",
              )}
              value={col.groupLevel > 0}
              onChange={state => {
                this.confirmIfMe(
                  col.user.id,
                  {
                    text: Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.modify_level',
                      [],
                      "Modifier votre niveau d'accès à l'entreprise ? (cette action n'est pas réversible si vous réduisez vos droits d'accès)",
                    ),
                  },
                  () => {
                    workspacesUsers.updateManagerRole(col.user.id, state);
                  },
                );
              }}
            />
          </div>
        ),
      },
      {
        type: 'text',
        text: Languages.t('scenes.app.popup.workspaceparameter.pages.edit_level_user_text'),
      },
    ]) || [
      {
        type: 'menu',
        text: Languages.t('scenes.app.popup.workspaceparameter.edit_from_console'),
        onClick: () =>
          window.open(
            ConsoleService.getCompanyUsersManagementUrl(WorkspaceService.currentGroupId),
            '_blank',
          ),
      },
    ];

    var bloc_edit_admin = [
      {
        type: 'react-element',
        text: '',
        icon: 'edit',
        reactElement: () => (
          <div className="editLevel">
            <Switch
              disabled={workspacesUsers.updateLevelUserLoading[col.user.id]}
              label={Languages.t('scenes.app.popup.workspaceparameter.pages.administrater_status')}
              value={col.level == adminLevelId}
              onChange={state =>
                this.confirmIfMe(
                  col.user.id,
                  {
                    text: Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.modify_level',
                      [],
                      "Modifier votre niveau d'accès à l'entreprise ? (cette action n'est pas réversible si vous réduisez vos droits d'accès)",
                    ),
                  },
                  () => {
                    workspacesUsers.updateUserLevel(col.user.id, state);
                  },
                )
              }
            />
          </div>
        ),
      },
      {
        type: 'text',
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.edit_level_administrater_text',
          [],
          "Un administrateur peut configurer l'espace de travail (identité de l'espace, applications, membres de l'espace).",
        ),
      },
    ];

    if (company) {
      menu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.invite_button',
          [],
          'Inviter dans cet espace',
        ),
        onClick: () => {
          workspacesUsers.addUserFromGroup(col.user.id, col.externe);
        },
      });
      if (workspaceUserRightsService.hasGroupPrivilege('MANAGE_MANAGERS')) {
        menu.push({ type: 'separator' });
        menu = menu.concat(bloc_edit_group_manager);
      }
      return (
        <div className="action">
          {menu.length > 0 && (
            <Menu className="option_button" style={{ padding: 4 }} menu={menu}>
              <EditIcon className="m-icon-small" />
            </Menu>
          )}
        </div>
      );
    } else {
      if (col.user.id == UserService.getCurrentUserId()) {
        menu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.app.popup.workspaceparameter.pages.quit_workspace_menu',
            [],
            'Quitter cet espace',
          ),
          className: 'error',
          onClick: () => {
            this.state.workspacesUsers.leaveWorkspace();
          },
        });
      } else if (workspaceUserRightsService.hasWorkspacePrivilege()) {
        menu = menu.concat(bloc_edit_admin);
        menu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.app.popup.workspaceparameter.pages.withdraw_button',
            [],
            'Retirer de cet espace',
          ),
          className: 'error',
          onClick: () => {
            AlertManager.confirm(() =>
              this.state.workspacesUsers.removeUser(
                col.user.id,
                WorkspaceService.currentWorkspaceId,
              ),
            );
          },
        });
      }

      if (workspaceUserRightsService.hasGroupPrivilege('MANAGE_MANAGERS')) {
        if (menu.length > 0) {
          menu.push({ type: 'separator' });
        }
        menu = menu.concat(bloc_edit_group_manager);
      }

      if (
        workspaceUserRightsService.hasWorkspacePrivilege() &&
        (col.user || {}).mail_verification_override != false &&
        (col.user || {}).mail_verification_override ==
          WorkspaceService.currentWorkspaceId + '_' + UserService.getCurrentUserId()
      ) {
        menu = [
          {
            type: 'menu',
            text: Languages.t('scenes.app.popup.workspace.edit_temp', [], 'Edit temporary account'),
            onClick: () => {
              MediumPopupManager.open(
                <CreateCompanyAccount edit email={col.user.mail_verification_override_mail} />,
                {
                  size: { width: 400 },
                },
              );
            },
          },
          { type: 'separator' },
        ].concat(menu);
      }

      return (
        <div className="action">
          {menu.length > 0 && (
            <Menu className="option_button" style={{ paddingTop: 8, paddingRight: 8 }} menu={menu}>
              <EditIcon className="m-icon-small" />
            </Menu>
          )}
        </div>
      );
    }
  }
  render() {
    var users = [];
    var usersInGroup = [];
    var adminLevelId = workspacesUsers.getAdminLevel().id;
    Object.keys(this.state.workspacesUsers.users_by_group[groupService.currentGroupId] || {}).map(
      key => {
        var user = this.state.workspacesUsers.users_by_group[groupService.currentGroupId][key].user;
        if (
          !this.state.workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[
            key
          ] ||
          !this.state.workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key]
            .user ||
          !this.state.workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key]
            .user.id
        ) {
          usersInGroup.push({
            id: user.id,
            user: user,
            externe:
              this.state.workspacesUsers.users_by_group[groupService.currentGroupId][key].externe,
            groupLevel:
              this.state.workspacesUsers.users_by_group[WorkspaceService.currentGroupId][key]
                .groupLevel,
          });
        }
      },
    );

    return (
      <div className="workspaceParameter">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.workspaceparameter.pages.collaborateurs',
            'Collaborateurs',
          )}
        </div>

        {workspacesUsers.errorOnInvitation && (
          <div className="blocError">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.invitation_error',
              [],
              "Une erreur s'est produite lors de l'invitation des personnes suivantes :",
            )}
            <br />
            <span className="text">
              {workspacesUsers.errorUsersInvitation.filter(item => item).join(', ')}
            </span>
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.invited_guest_check_message',
                [],
                "Vérifiez que le nom d'utilisateur ou le mail utilisé est valide.",
              )}
            </div>
          </div>
        )}

        <Tabs
          fullBody
          tabs={[
            {
              title: Languages.t(
                'scenes.apps.parameters.workspace_sections.members.members',
                [],
                'Members',
              ),
              render: <Members buildMenu={e => this.buildMenu(e)} />,
            },
            InitService.server_infos?.configuration?.account?.type !== 'console' && {
              title: Languages.t(
                'scenes.apps.parameters.workspace_sections.members.pending',
                [],
                'Pending',
              ),
              render: <Pending buildMenu={e => this.buildMenu(e)} />,
            },
          ]}
        />
      </div>
    );
  }
}
