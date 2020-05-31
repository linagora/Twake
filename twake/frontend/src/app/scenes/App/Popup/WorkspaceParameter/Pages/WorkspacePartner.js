import React, {Component} from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceService from 'services/workspaces/workspaces.js';
import groupService from 'services/workspaces/groups.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import Table from 'components/Table/Table.js';
import Menu from 'components/Menus/Menu.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch.js';
import workspaceUserRightsService from 'services/workspaces/workspace_user_rights.js';
import UserService from 'services/user/user.js';
import Button from 'components/Buttons/Button.js';
import CreateCompanyAccount from './CreateCompanyAccount.js';
import MediumPopupManager from 'services/mediumPopupManager/mediumPopupManager.js';
import CryptoJS from 'crypto-js';
import './Pages.scss';

export default class WorkspacePartner extends Component {
  constructor() {
    super();
    var workspace = Collections.get('workspaces').find(workspaceService.currentWorkspaceId);
    this.state = {
      i18n: Languages,
      workspace: Collections.get('workspaces'),
      workspaceService: workspaceService,
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
    if (!workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)) {
      workspacesUsers.load(workspaceService.currentWorkspaceId, true);
    }
    this.inputWorkspaceName = null;
    Collections.get('workspaces').addListener(this);
    workspaceService.addListener(this);
    workspacesUsers.addListener(this);
    workspaceUserRightsService.addListener(this);
    Languages.addListener(this);
  }
  componentWillMount() {
    this.state.workspaceLogo = false;
  }
  componentWillUnmount() {
    Collections.get('workspaces').addListener(this);
    workspaceService.removeListener(this);
    workspacesUsers.removeListener(this);
    workspaceUserRightsService.removeListener(this);
    Languages.removeListener(this);
  }
  componentDidMount() {
    workspacesUsers.load(workspaceService.currentWorkspaceId, true);
  }
  onChangeMail(e, member_index) {
    this.state.members[member_index].mail = e.target.value;

    var that = this;
    that.state.collaborators = 0;
    var notEmpty = false;
    this.state.members.forEach(function(member, i) {
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

    var bloc_edit_group_manager = [
      {
        type: 'react-element',
        text: '',
        icon: 'edit',
        reactElement: () => (
          <div className="editLevel">
            <Switch
              disabled={workspacesUsers.updateRoleUserLoading[col.id]}
              label={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.company_manager_label',
                [],
                "Gérant de l'entreprise",
              )}
              value={
                this.state.workspacesUsers.users_by_group[workspaceService.currentGroupId][col.id]
                  .groupLevel > 0
              }
              onChange={state => {
                this.confirmIfMe(
                  col.id,
                  {
                    text: Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.modify_level',
                      [],
                      "Modifier votre niveau d'accès à l'entreprise ? (cette action n'est pas réversible si vous réduisez vos droits d'accès)",
                    ),
                  },
                  () => {
                    workspacesUsers.updateManagerRole(col.id, state);
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
          "Un utilisateur gérant d'entreprise peut accéder à l'administration complète de l'entreprise (paiements, membres de l'entreprise, identité de l'entreprise).",
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
              disabled={workspacesUsers.updateLevelUserLoading[col.id]}
              label={'Administrateur'}
              value={
                this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)[
                  col.id
                ].level == adminLevelId
              }
              onChange={state =>
                this.confirmIfMe(
                  col.id,
                  {
                    text: Languages.t(
                      'scenes.app.popup.workspaceparameter.pages.modify_level',
                      [],
                      "Modifier votre niveau d'accès à l'entreprise ? (cette action n'est pas réversible si vous réduisez vos droits d'accès)",
                    ),
                  },
                  () => {
                    workspacesUsers.updateUserLevel(col.id, state);
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
      if (col.id == UserService.getCurrentUserId()) {
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
              this.state.workspacesUsers.removeUser(col.id, workspaceService.currentWorkspaceId),
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
          workspaceService.currentWorkspaceId + '_' + UserService.getCurrentUserId()
      ) {
        menu = [
          {
            type: 'menu',
            text: 'Edit temporary account',
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
            <Menu className="option_button" style={{ padding: 4 }} menu={menu}>
              <EditIcon className="m-icon-small" />
            </Menu>
          )}
        </div>
      );
    }
  }
  render() {
    var mail_inputs = 0;
    var last_not_empty = 0;
    var users = [];
    var usersInGroup = [];
    var adminLevelId = workspacesUsers.getAdminLevel().id;
    var non_pending_mails = [];
    Object.keys(
      this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId),
    ).map(key => {
      var user = this.state.workspacesUsers.getUsersByWorkspace(
        workspaceService.currentWorkspaceId,
      )[key].user;
      if (user.mail_hash) {
        non_pending_mails.push(user.mail_hash);
      }
      if (user.mail_verification_override_mail) {
        non_pending_mails.push(user.mail_verification_override_mail);
      }
      users.push({
        id: user.id,
        user: user,
        externe: this.state.workspacesUsers.getUsersByWorkspace(
          workspaceService.currentWorkspaceId,
        )[key].externe,
        level: this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)[
          key
        ].level,
        groupLevel: this.state.workspacesUsers.users_by_group[workspaceService.currentGroupId][key]
          .groupLevel,
        isAdmin:
          adminLevelId ==
          this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)[key]
            .level,
      });
    });
    Object.keys(this.state.workspacesUsers.users_by_group[groupService.currentGroupId]).map(key => {
      var user = this.state.workspacesUsers.users_by_group[groupService.currentGroupId][key].user;
      if (
        !this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)[key] ||
        !this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)[key]
          .user ||
        !this.state.workspacesUsers.getUsersByWorkspace(workspaceService.currentWorkspaceId)[key]
          .user.id
      ) {
        usersInGroup.push({
          id: user.id,
          user: user,
          externe: this.state.workspacesUsers.users_by_group[groupService.currentGroupId][key]
            .externe,
          groupLevel: this.state.workspacesUsers.users_by_group[workspaceService.currentGroupId][
            key
          ].groupLevel,
        });
      }
    });

    var pendingMail = [];
    this.state.workspacesUsers.membersPending.map(pending => {
      var mail = (pending.mail || '').toLocaleLowerCase().trim();
      console.log(mail);
      console.log(non_pending_mails);
      console.log(CryptoJS.MD5(mail));
      if (
        non_pending_mails.indexOf(mail) < 0 &&
        non_pending_mails.indexOf(CryptoJS.MD5(mail) + '') < 0
      ) {
        pendingMail.push(pending);
      }
    });

    return (
      <div className="workspaceParameter">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.workspaceparameter.pages.collaborateurs',
            [],
            'Collaborateurs',
          )}
        </div>

        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.worspace_subtitle',
              [],
              'Espace de travail',
            )}
          </div>

          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.collaboraters_small_text',
              [users.length],
              'Collaborateurs dans cet espace de travail $1',
            )}
          </div>

          <Table
            column={[
              {
                title: 'Name',
                dataIndex: 'name',
                render: col => {
                  return (
                    <div
                      className="absolute_position"
                      style={{ paddingRight: 8, boxSizing: 'border-box' }}
                    >
                      <div
                        class="user_image"
                        style={{
                          backgroundImage: 'url(' + UserService.getThumbnail(col.user) + ')',
                        }}
                      />
                      <div className="fix_text_padding_medium text-complete-width">
                        {UserService.getFullName(col.user)} (@{col.user.username})
                      </div>
                    </div>
                  );
                },
              },
              {
                title: 'Status',
                width: 300,
                dataIndex: 'level',
                render: col => {
                  var tags = [];
                  if (col.isAdmin) {
                    tags.push(
                      <div className="tag blue">
                        {Languages.t(
                          'scenes.app.popup.workspaceparameter.pages.administrater_status',
                          [],
                          'Administrateur',
                        )}
                      </div>,
                    );
                  }
                  if (col.groupLevel > 0 && col.groupLevel !== null) {
                    tags.push(
                      <div className="tag orange">
                        {Languages.t(
                          'scenes.app.popup.workspaceparameter.pages.company_manager_status',
                          [],
                          "Gérant d'entreprise",
                        )}
                      </div>,
                    );
                  }
                  if (col.externe) {
                    tags.push(
                      <div className="tag green">
                        {Languages.t(
                          'scenes.app.popup.workspaceparameter.pages.guest_status',
                          [],
                          'Invité',
                        )}
                      </div>,
                    );
                  }
                  return <div className="fix_text_padding_medium">{tags}</div>;
                },
              },
              {
                title: '',
                width: 30,
                dataIndex: 'action',
                render: col => {
                  return this.buildMenu(col);
                },
              },
            ]}
            data={users}
          />
        </div>

        {pendingMail.length > 0 && (
          <div>
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.invited_collaboraters_by_mail',
                [pendingMail.length],
                'Collaborateurs invités par email ',
              )}
            </div>
            <Table
              column={[
                {
                  title: 'Email',
                  render: col => (
                    <div className="absolute_position">
                      <div className="fix_text_padding_medium text-complete-width">{col.mail}</div>
                    </div>
                  ),
                },
                {
                  title: 'Status',
                  width: 160,
                  dataIndex: 'level',
                  render: col => {
                    if (col.externe) {
                      return (
                        <div className="fix_text_padding_medium">
                          <div className="tag green">
                            {Languages.t(
                              'scenes.app.popup.workspaceparameter.pages.extern_guest',
                              [],
                              'Utilisateur invité',
                            )}
                          </div>
                        </div>
                      );
                    }
                    return '';
                  },
                },
                {
                  title: '',
                  width: 30,
                  dataIndex: 'action',
                  render: col => {
                    if (!workspaceUserRightsService.hasWorkspacePrivilege()) {
                      return '';
                    }
                    return (
                      <div className="action">
                        <Menu
                          className="option_button"
                          style={{ padding: 4 }}
                          menu={[
                            {
                              type: 'menu',
                              text: 'Create temporary account',
                              onClick: () => {
                                MediumPopupManager.open(<CreateCompanyAccount email={col.mail} />, {
                                  size: { width: 400 },
                                });
                              },
                            },
                            { type: 'separator' },
                            {
                              type: 'menu',
                              className: 'danger',
                              text: "Annuler l'invitation",
                              onClick: () => {
                                AlertManager.confirm(
                                  () => workspacesUsers.removeInvitation(col.mail),
                                  () => {},
                                  {
                                    text: Languages.t(
                                      'scenes.app.popup.workspaceparameter.pages.cancel_invitation_button',
                                      [],
                                      "Annuler l'invitation par mail.",
                                    ),
                                  },
                                );
                              },
                            },
                          ]}
                        >
                          <EditIcon className="m-icon-small" />
                        </Menu>
                      </div>
                    );
                  },
                },
              ]}
              data={pendingMail}
            />
          </div>
        )}

        {workspacesUsers.errorOnInvitation && (
          <div className="blocError">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.invitation_error',
              [],
              "Une erreur s'est produite lors de l'invitation des personnes suivantes :\n",
            )}
            {workspacesUsers.errorUsersInvitation
              .filter(item => item)
              .map(item => {
                return [item, <br />];
              })}
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.invited_guest_check_message',
                [],
                "Vérifiez que le nom d'utilisateur ou le mail utilisé est valide.",
              )}
            </div>
          </div>
        )}

        {workspaceUserRightsService.hasWorkspacePrivilege() && (
          <div className="addMemberBtn">
            <Button
              onClick={() => {
                popupManager.open(<AddUser standalone />);
              }}
              type="submit"
              class="medium"
              value={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.collaboraters_adding_button',
                [],
                'Ajouter des collaborateurs',
              )}
            />
          </div>
        )}

        {usersInGroup.length > 0 && (
          <div className="group_section">
            <div className="subtitle">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.company_subtitle',
                [],
                'Entreprise',
              )}
            </div>

            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.other_collaboraters-small_text',
                [usersInGroup.length],
                'Autres collaborateurs dans cette entreprise ($1)',
              )}
            </div>

            <Table
              unFocused
              noHeader
              column={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  render: col => {
                    return (
                      <div className="absolute_position">
                        <div
                          class="user_image"
                          style={{
                            backgroundImage: 'url(' + UserService.getThumbnail(col.user) + ')',
                          }}
                        />
                        <div className="fix_text_padding_medium text-complete-width">
                          {UserService.getFullName(col.user)} (@{col.user.username})
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: 'Droits',
                  width: 150,
                  dataIndex: 'level',
                  render: col => {
                    var tags = [];
                    if (col.groupLevel > 0 && col.groupLevel != null) {
                      tags.push(
                        <div className="tag orange">
                          {Languages.t(
                            'scenes.app.popup.workspaceparameter.pages.company_manager_label',
                            [],
                            "Gérant de l'entreprise",
                          )}
                        </div>,
                      );
                    }
                    if (col.externe) {
                      tags.push(
                        <div className="tag green">
                          {Languages.t(
                            'scenes.app.popup.workspaceparameter.pages.extern',
                            [],
                            'Externe',
                          )}
                        </div>,
                      );
                    }
                    return <div className="fix_text_padding_medium">{tags}</div>;
                  },
                },
                {
                  title: '',
                  width: 30,
                  dataIndex: 'action',
                  render: col => {
                    return this.buildMenu(col, true);
                  },
                },
              ]}
              data={usersInGroup}
            />
          </div>
        )}
      </div>
    );
  }
}
