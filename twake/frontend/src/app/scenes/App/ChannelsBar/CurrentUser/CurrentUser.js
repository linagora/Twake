import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import UserService from 'services/user/user.js';
import CurrentUserService from 'services/user/current_user.js';
import MenusManager from 'services/Menus/MenusManager.js';
import LoginService from 'services/login/login.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import ListenUsers from 'services/user/listen_users.js';
import UserParameter from 'scenes/App/Popup/UserParameter/UserParameter.js';
import InputWithIcon from 'components/Inputs/InputWithIcon.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import NotificationParameters from 'services/user/notification_parameters.js';
import CreateWorkspacePage from 'scenes/App/Popup/CreateWorkspacePage/CreateWorkspacePage.js';
import CreateCompanyView from 'scenes/App/Popup/CreateCompanyView/CreateCompanyView.js';
import CompanyHeaderUI from 'components/Leftbar/CompanyHeader/CompanyHeader.js';
import popupManager from 'services/popupManager/popupManager.js';
import Button from 'components/Buttons/Button.js';

export default class CurrentUser extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      users_repository: Collections.get('users'),
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
    var current_user = this.state.users_repository.known_objects_by_id[this.user_id];
    if (!current_user.status_icon[0]) {
      current_user.status_icon[1] = '';
    }
    this.state.new_status = current_user.status_icon;

    //TODO to remove
    /*const inter = setInterval(() => {
      if (WorkspaceUserRights.hasWorkspacePrivilege()) {
        popupManager.open(<WorkspaceParameter initial_page={2} />, true, 'workspace_parameters');
      }
      clearInterval(inter);
    }, 1000);*/
  }
  updateStatus(value) {
    value = value || this.state.new_status;
    CurrentUserService.updateStatusIcon([
      value[0] == 'trash' ? '' : value[0],
      value[0] == 'trash' ? '' : value[1],
    ]);
    MenusManager.closeMenu();
    this.setState({ new_status: ['', ''] });
    MenusManager.notify();
  }
  onClickUser(evt) {
    var current_user = this.state.users_repository.known_objects_by_id[this.user_id];
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
                this.state.new_status = current_user.status_icon;
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
                    if (value[0] == 'trash') {
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
          popupManager.open(<UserParameter />);
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
      /*
      if(WorkspaceUserRights.hasGroupPrivilege("MANAGE_PRICINGS")){
        usermenu.push(
          {type:"menu", text:"Changer d'abonnement", icon:"arrow-circle-up", onClick:()=>{ popupManager.open(<WorkspaceParameter initial_page={5} />, true, "workspace_parameters")}},
        );
      }
      */
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
    if (!WorkspaceUserRights.isGroupInvite()) {
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
  onClickBell(evt) {
    var current_user = this.state.users_repository.known_objects_by_id[this.user_id];

    this.dont_disturb = NotificationParameters.transform_period(
      UserService.getCurrentUser().notifications_preferences.dont_disturb_between,
      UserService.getCurrentUser().notifications_preferences.dont_disturb_and,
      -new Date().getTimezoneOffset() / 60,
    );
    this.notifications_state = NotificationParameters.getNotificationsStatus(current_user);

    this.notifications_menu = [
      /*      {type:"menu", text:"Afficher mes dernières notifications"},
      {type:"menu", text:"Supprimer toutes mes notifications", onClick:()=>{ NotificationsService.readAll(); }},
      {type:"separator"},*/
      {
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.user_parameter',
          [],
          'Paramètres de notification',
        ),
        onClick: () => {
          popupManager.open(<UserParameter defaultPage={3} />, true, true);
        },
      },
      {
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.disabling_notifications',
          [],
          'Désactiver pendant 1h',
        ),
        onClick: () => {
          NotificationParameters.saveElements(
            { disable_until: parseInt(new Date().getTime() / 1000 + 60 * 60) },
            true,
          );
        },
      },
      {
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.disabling_notifications_until',
          [],
          "Désactiver jusqu'à demain 9h",
        ),
        onClick: () => {
          var a = new Date();
          a.setDate(new Date().getDate() + 1);
          a.setHours(9);
          a.setMinutes(0);
          a = parseInt(a.getTime() / 1000);
          NotificationParameters.saveElements({ disable_until: a }, true);
        },
      },
    ];

    if (this.notifications_state != 'off') {
      this.notifications_menu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.disable_notifications',
          [],
          'Désactiver',
        ),
        onClick: () => {
          NotificationParameters.saveElements(
            { disable_until: parseInt(new Date().getTime() / 1000 + 60 * 60 * 24 * 10000) },
            true,
          );
        },
      });
    }

    if (this.notifications_state != 'on') {
      this.notifications_menu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.reactivate_notifications',
          [],
          'Réactiver',
        ),
        onClick: () => {
          NotificationParameters.saveElements({ disable_until: 0 }, true);
        },
      });

      var disabled_until = new Date(
        UserService.getCurrentUser().notifications_preferences.disable_until * 1000,
      );

      if (this.notifications_state == 'off') {
        this.notifications_menu.push({
          type: 'text',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.desactivated_notifications_message',
            [],
            'Vos notifications sont désactivées.',
          ),
        });
      } else if (NotificationParameters.is_in_period(this.dont_disturb[0], this.dont_disturb[1])) {
        var a = this.dont_disturb[0];
        var b = this.dont_disturb[1];
        a = Math.floor(a) + 'h' + ((a - Math.floor(a)) * 60 || '00');
        b = Math.floor(b) + 'h' + ((b - Math.floor(b)) * 60 || '00');
        this.notifications_menu.push({
          type: 'text',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.desactivated_notifiations_information',
            [a, b],
            "Vos notifications sont désactivées la nuit de $1 jusqu'à $2.",
          ),
        });
      } else if (
        UserService.getCurrentUser().notifications_preferences.disable_until <
        new Date().getTime() / 1000 + 60 * 60 * 11
      ) {
        this.notifications_menu.push({
          type: 'text',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.desactivated_notifiations_information_until',
            [disabled_until.getHours(), disabled_until.getMinutes()],
            "Vos notifications sont désactivées jusqu'à $1:$2.",
          ),
        });
      } else {
        this.notifications_menu.push({
          type: 'text',
          text: Languages.t(
            'scenes.app.channelsbar.currentuser.desactivated_notifiations_information_no_choice',
            [],
            "Vos notifications sont désactivées jusqu'à demain 9h.",
          ),
        });
      }
    }

    var pos = window.getBoundingClientRect(this.bell_node);
    pos.x = pos.x || pos.left;
    pos.y = pos.y || pos.top;

    MenusManager.openMenu(
      this.notifications_menu,
      { x: pos.x + pos.width - 5, y: pos.y + pos.height + 10 },
      'bottom',
    );
  }
  render() {
    var current_user = this.state.users_repository.known_objects_by_id[this.user_id];

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
        user={current_user}
        status={status}
        notificationsDisabled={notifications_disabled}
        onClickUser={evt => {
          this.onClickUser(evt);
        }}
        onClickBell={evt => {
          this.onClickBell(evt);
        }}
        style={{ marginBottom: 10 }}
      />
    );
  }
}
