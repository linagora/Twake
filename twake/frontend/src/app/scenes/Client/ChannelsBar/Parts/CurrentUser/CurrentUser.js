import React, { Component } from 'react';
import {isRecoilValue} from 'recoil';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import UserService from 'services/user/UserService';
import CurrentUserService from 'app/services/user/CurrentUser';
import MenusManager from 'app/components/Menus/MenusManager.js';
import LoginService from 'services/login/login.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import ListenUsers from 'services/user/ListenUsers';
import UserParameter from 'app/scenes/Client/Popup/UserParameter/UserParameter.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import WorkspaceParameter from 'app/scenes/Client/Popup/WorkspaceParameter/WorkspaceParameter.js';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import NotificationParameters from 'services/user/notification_parameters.js';
import CreateWorkspacePage from 'app/scenes/Client/Popup/CreateWorkspacePage/CreateWorkspacePage.js';
import CreateCompanyView from 'app/scenes/Client/Popup/CreateCompanyView/CreateCompanyView.js';
import CompanyHeaderUI from 'app/scenes/Client/ChannelsBar/Parts/CurrentUser/CompanyHeader/CompanyHeader';
import popupManager from 'services/popupManager/popupManager.js';
import Button from 'components/Buttons/Button.js';
import InitService from 'app/services/InitService';
import AccessRightsService from 'services/AccessRightsService';
import Workspaces from 'services/workspaces/workspaces.js';

export default class CurrentUser extends Component {
  constructor() {
    super();

    this.users_repository = Collections.get('users');
    this.i18n = Languages;

    this.state = {
      new_status: ['', ''],
    };

    this.preferedEmojisStatus = [
      'trash',
      ':palm_tree:',
      ':calendar:',
      ':red_car:',
      ':hamburger:',
      ':sleeping_accommodation:',
    ];
  }
  componentWillMount() {
    this.user_id = UserService.getCurrentUserId();

    ListenUsers.listenUser(this.user_id);
    Collections.get('users').addListener(this);
    Collections.get('users').listenOnly(this, [
      Collections.get('users').find(this.user_id).front_id,
    ]);
    Languages.addListener(this);
    this.refreshUserState = setInterval(() => {
      this.setState({});
    }, 60000);
  }
  componentWillUnmount() {
    ListenUsers.cancelListenUser(this.user_id);
    Collections.get('users').removeListener(this);
    Languages.removeListener(this);
    clearInterval(this.refreshUserState);
  }
  componentDidMount() {
    const new_status = {...this.users_repository.known_objects_by_id[this.user_id].status_icon};

    if (!new_status[0]) {
      new_status[1] = '';
    }

    this.setState({ new_status });
  }
  updateStatus(value) {
    value = value || this.state.new_status;
    CurrentUserService.updateStatusIcon([
      value[0] === 'trash' ? '' : value[0],
      value[0] === 'trash' ? '' : value[1],
    ]);
    MenusManager.closeMenu();
    this.setState({ new_status: ['', ''] });
    MenusManager.notify();
  }
  onClickUser(evt) {
    var current_user = this.users_repository.known_objects_by_id[this.user_id];
    var usermenu = [
      {
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.change_my_status',
          [],
          'Changer mon statut',
        ),
        emoji: (current_user.status_icon || {})[0] || ':smiley:',
        submenu_replace: true,
        submenu: [
          {
            type: 'title',
            text: Languages.t(
              'scenes.app.channelsbar.currentuser.change_my_status',
              [],
              'Changer mon statut',
            ),
          },
          {
            type: 'react-element',
            reactElement: level => {
              if (this.state.new_status[0].length <= 0) {
                this.setState({ new_status: current_user.status_icon });
              }
              return (
                <InputWithIcon
                  focusOnDidMount
                  menu_level={level}
                  preferedEmoji={this.preferedEmojisStatus}
                  placeholder={Languages.t(
                    'scenes.app.popup.appsparameters.pages.status_tilte',
                    [],
                    'Status',
                  )}
                  value={this.state.new_status}
                  onChange={value => {
                    if (value[0] === 'trash') {
                      this.updateStatus(value);
                    } else {
                      this.setState({ new_status: value });
                      MenusManager.notify();
                    }
                  }}
                />
              );
            },
          },
          {
            type: 'react-element',
            reactElement: level => {
              return (
                <div className="menu-buttons">
                  <Button
                    disabled={this.state.new_status[1].length <= 0}
                    type="button"
                    value={Languages.t(
                      'scenes.app.channelsbar.currentuser.update',
                      [],
                      'Mettre à jour',
                    )}
                    onClick={() => {
                      this.updateStatus();
                    }}
                  />
                </div>
              );
            },
          },
        ],
      },
      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.currentuser.title', [], 'Paramètres du compte'),
        icon: 'cog',
        onClick: () => {
          if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
            return window.open(
              InitService.server_infos?.configuration?.accounts?.console?.account_management_url,
              '_blank',
            );
          } else {
            popupManager.open(<UserParameter />);
          }
        },
      },
      { type: 'separator' },
      {
        type: 'text',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.workspace_info',
          [
            (Collections.get('workspaces').find(WorkspaceService.currentWorkspaceId) || {}).name,
            (Collections.get('groups').find(WorkspaceService.currentGroupId) || {}).name,
          ],
          "Vous êtes dans l'espace de travail $1 du groupe $2.",
        ),
      },
    ];
    if (!WorkspaceUserRights.isInvite()) {
      if (WorkspaceUserRights.hasWorkspacePrivilege()) {
        usermenu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.workspace_parameters',
            [],
            "Paramètres de l'espace",
          ),
          icon: 'cog',
          onClick: () => {
            popupManager.open(<WorkspaceParameter />, true, 'workspace_parameters');
          },
        });
      }

      if (WorkspaceUserRights.hasWorkspacePrivilege()) {
        usermenu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.add_apps',
            [],
            'Chercher des applications',
          ),
          icon: 'apps',
          onClick: () => {
            popupManager.open(
              <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
              true,
              'workspace_parameters',
            );
          },
        });
      }

      usermenu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.collaborateurs',
          [],
          'Collaborateurs',
        ),
        icon: 'users-alt',
        onClick: () => {
          popupManager.open(<WorkspaceParameter initial_page={2} />, true, 'workspace_parameters');
        },
      });
    } else {
      usermenu.push(
        {
          type: 'text',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.invited_status',
            [],
            'Vous êtes un invité.',
          ),
        },
        {
          type: 'menu',
          text: Languages.t(
            'scenes.app.popup.workspaceparameter.pages.quit_workspace_menu',
            [],
            "Quitter l'espace",
          ),
          icon: 'plane-fly',
          className: 'error',
          onClick: () => {
            WorkspacesUsers.leaveWorkspace();
          },
        },
      );
    }

    usermenu.push({ type: 'separator' });
    if (
      !WorkspaceUserRights.isGroupInvite() &&
      (AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'administrator') ||
        AccessRightsService.hasCompanyLevel(Workspaces.currentGroupId, 'administrator'))
    ) {
      usermenu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.create_workspace_page',
          [],
          'Créer un espace de travail',
        ),
        icon: 'plus',
        onClick: () => {
          popupManager.open(<CreateWorkspacePage />);
        },
      });
    }
    if (InitService.server_infos?.configuration?.accounts?.type !== 'console') {
      usermenu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.create_company_page',
          [],
          'Créer une entreprise',
        ),
        icon: 'plus',
        onClick: () => {
          popupManager.open(<CreateCompanyView />);
        },
      });
    }
    usermenu = usermenu.concat([
      { type: 'separator' },
      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.currentuser.logout', [], 'Se déconnecter'),
        icon: 'sign-out-alt',
        className: 'error',
        onClick: () => {
          LoginService.logout();
        },
      },
    ]);

    var pos = window.getBoundingClientRect(this.node);
    pos.x = pos.x || pos.left;
    pos.y = pos.y || pos.top;

    MenusManager.openMenu(
      usermenu,
      { x: pos.x + pos.width / 2, y: pos.y + pos.height + 10 },
      'bottom',
    );
  }

  render() {
    var current_user = this.users_repository.known_objects_by_id[this.user_id];

    if (!current_user) {
      return '';
    }

    var notifications_disabled = false;
    if (
      current_user &&
      NotificationParameters.hasNotificationsDisabled(current_user.notifications_preferences)
    ) {
      notifications_disabled = true;
    }
    var status = NotificationParameters.getNotificationsStatus(current_user);

    return (
      <CompanyHeaderUI
        refDivUser={node => (this.node = node)}
        refDivBell={node => (this.bell_node = node)}
        companyName={
          (Collections.get('workspaces').find(WorkspaceService.currentWorkspaceId) || {}).name ||
          '-'
        }
        status={status}
        notificationsDisabled={notifications_disabled}
        onClickUser={evt => {
          this.onClickUser(evt);
        }}
        style={{ marginBottom: 10 }}
      />
    );
  }
}
