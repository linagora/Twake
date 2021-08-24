import React, { Component, useEffect, useState } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import groupService from 'services/workspaces/groups.js';
import workspacesUsers from 'services/workspaces/workspaces_users';
import Menu from 'components/Menus/Menu.js';
import AlertManager from 'services/AlertManager/AlertManager';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch';
import workspaceUserRightsService from 'services/workspaces/WorkspaceUserRights';
import UserService from 'services/user/UserService';
import CreateCompanyAccount from './CreateCompanyAccount.js';
import MediumPopupManager from 'app/components/Modal/ModalManager';
import './Pages.scss';
import Pending from 'app/scenes/Client/Popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Pending.js';
import Members from 'app/scenes/Client/Popup/WorkspaceParameter/Pages/WorkspacePartnerTabs/Members.js';
import Tabs from 'components/Tabs/Tabs.js';
import InitService from 'app/services/InitService';
import ConsoleService from 'app/services/Console/ConsoleService';
// import { Switch } from 'antd';
import { UserType } from 'app/models/User.js';

export const AdminSwitch = (props: { col: any; adminLevelId: string; onChange: any }) => {
  workspacesUsers.useListener(useState);
  const loading = workspacesUsers.updateLevelUserLoading[props.col.user.id];
  const checked = props.col.level === props.adminLevelId;
  return (
    <div className="editLevel">
      <Switch
        loading={loading}
        label={Languages.t('scenes.app.popup.workspaceparameter.pages.administrater_status')}
        checked={checked}
        onChange={props.onChange}
      />
    </div>
  );
};

export default () => {
  const workspace = Collections.get('workspaces').find(WorkspaceService.currentWorkspaceId);

  const [attributeOpen, setAttributeOpen] = useState(0);
  const [subMenuOpened, setSubMenuOpened] = useState(0);
  const [workspaceName, setWorkspaceName] = useState(workspace ? workspace.name : '');
  const [groupName, setGroupName] = useState(workspace ? workspace.group.name : '');
  const [workspaceLogo, setWorkspaceLogo] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [asExterne, setAsExterne] = useState(false);
  const [collaborators, setCollaborators] = useState(0);
  const [inputToShow, setInputToShow] = useState(2);
  Collections.get('workspaces').useListener(useState);
  WorkspaceService.useListener(useState);
  workspacesUsers.useListener(useState);
  workspaceUserRightsService.useListener(useState);
  Languages.useListener(useState);

  const onChangeMail = (e: any, member_index: number) => {
    // eslint-disable-next-line react/no-direct-mutation-state
    // this.state.members[member_index].mail = e.target.value;
    // var that = this;
    // that.state.collaborators = 0;
    // var notEmpty = false;
    // this.state.members.forEach(function (member, i) {
    //   if (member.mail.length > 0) {
    //     notEmpty = true;
    //     that.state.input_to_show = i + 1;
    //     that.state.collaborators++;
    //   }
    // });
    // if (!notEmpty) {
    //   that.state.input_to_show = 1;
    // }
    // this.setState({ input_to_show: Math.max(2, this.state.input_to_show + 1) });
    // this.setState({});
  };
  const confirmIfMe = (id: string, options: any, callback: any) => {
    if (id === UserService.getCurrentUserId()) {
      AlertManager.confirm(callback, () => {}, options);
    } else {
      callback();
    }
  };

  const buildMenu = (col: any, company?: any) => {
    let menu: any[] = [];
    let adminLevelId = workspacesUsers.getAdminLevel().id;

    var bloc_edit_group_manager = (InitService.server_infos?.configuration?.accounts?.type !==
      'console' && [
      {
        type: 'react-element',
        text: '',
        icon: 'edit',
        reactElement: () => (
          <div className="editLevel">
            <Switch
              disabled={workspacesUsers.updateRoleUserLoading[col.user.id || ''] as any}
              label={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.company_manager_label',
                [],
                "Gérant de l'entreprise",
              )}
              checked={col.groupLevel > 0}
              onChange={(state: boolean) => {
                confirmIfMe(
                  col.user.id,
                  {
                    text: Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.modify_level',
                      [],
                      'Change your access level to the company? (this action is not reversible if you reduce your access rights)',
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
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.edit_level_user_text',
          [],
          'A company manager user can access the full administration of the company (payments, company users, company identity).',
        ),
      },
    ]) || [
      {
        type: 'menu',
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.edit_from_console',
          [],
          'Edit from Console',
        ),
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
        reactElement: (
          <AdminSwitch
            col={col}
            adminLevelId={adminLevelId}
            onChange={(state: any) =>
              confirmIfMe(
                col.user.id,
                {
                  text: Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.modify_level',
                    [],
                    'Change your access level to the company? (this action is not reversible if you reduce your access rights)',
                  ),
                },
                () => {
                  workspacesUsers.updateUserLevel(col.user.id, state);
                },
              )
            }
          />
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
          'Invite in this space',
        ),
        onClick: () => {
          workspacesUsers.addUserFromGroup(col.user.id || '', col.externe || '');
        },
      });
      if (workspaceUserRightsService.hasGroupPrivilege()) {
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
      if (col.user.id === UserService.getCurrentUserId()) {
        menu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.app.popup.workspaceparameter.pages.quit_workspace_menu',
            [],
            'Leave this workspace',
          ),
          className: 'error',
          onClick: () => {
            workspacesUsers.leaveWorkspace();
          },
        });
      } else if (workspaceUserRightsService.hasWorkspacePrivilege()) {
        menu = menu.concat(bloc_edit_admin);
        menu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.app.popup.workspaceparameter.pages.withdraw_button',
            [],
            'Remove from this workspace',
          ),
          className: 'error',
          onClick: () => {
            AlertManager.confirm(() =>
              workspacesUsers.removeUser(col.user.id, WorkspaceService.currentWorkspaceId),
            );
          },
        });
      }

      if (workspaceUserRightsService.hasGroupPrivilege()) {
        if (menu.length > 0) {
          menu.push({ type: 'separator' });
        }
        menu = menu.concat(bloc_edit_group_manager);
      }

      if (
        workspaceUserRightsService.hasWorkspacePrivilege() &&
        (col.user || {}).mail_verification_override !== false &&
        (col.user || {}).mail_verification_override ===
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
  };

  // eslint-disable-next-line no-unused-vars
  var users = [];
  var usersInGroup = [];
  // eslint-disable-next-line no-unused-vars
  var adminLevelId = workspacesUsers.getAdminLevel().id;
  Object.keys(workspacesUsers.users_by_group[groupService.currentGroupId] || {}).map(
    // eslint-disable-next-line array-callback-return
    key => {
      var user = workspacesUsers.users_by_group[groupService.currentGroupId][key].user;
      if (
        !workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key] ||
        !workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key].user ||
        !workspacesUsers.getUsersByWorkspace(WorkspaceService.currentWorkspaceId)[key].user.id
      ) {
        usersInGroup.push({
          id: user.id,
          user: user,
          externe: workspacesUsers.users_by_group[groupService.currentGroupId][key].externe,
          groupLevel:
            workspacesUsers.users_by_group[WorkspaceService.currentGroupId][key].groupLevel,
        });
      }
    },
  );

  return (
    <div className="workspaceParameter">
      <div className="title">
        {Languages.t(
          'scenes.app.popup.workspaceparameter.pages.collaborateurs',
          [],
          'Collaborators',
        )}
      </div>

      {workspacesUsers.errorOnInvitation && (
        <div className="blocError">
          {Languages.t(
            'scenes.app.popup.workspaceparameter.pages.invitation_error',
            [],
            'An error occurred while inviting the following users: ',
          )}
          <br />
          <span className="text">
            {workspacesUsers.errorUsersInvitation.filter(item => item).join(', ')}
          </span>
          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.invited_guest_check_message',
              [],
              'Check that the username or e-mail used is valid.',
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
            render: <Members buildMenu={(e: any) => buildMenu(e)} />,
          },
          InitService.server_infos?.configuration?.accounts?.type !== 'console' && {
            title: Languages.t(
              'scenes.apps.parameters.workspace_sections.members.pending',
              [],
              'Pending',
            ),
            render: <Pending buildMenu={(e: any) => buildMenu(e)} />,
          },
        ]}
      />
    </div>
  );
};
