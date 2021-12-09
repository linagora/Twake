// eslint-disable-next-line no-use-before-define
import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import UserService from 'services/user/UserService';
import CurrentUserService from 'app/services/user/CurrentUser';
import MenusManager from 'app/components/Menus/MenusManager.js';
import LoginService from 'app/services/login/LoginService';
import WorkspaceService from 'services/workspaces/workspaces.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users';
import ListenUsers from 'services/user/ListenUsers';
import UserParameter from 'app/scenes/Client/Popup/UserParameter/UserParameter.js';
import InputWithIcon from 'components/Inputs/InputWithIcon';
import WorkspaceParameter from 'app/scenes/Client/Popup/WorkspaceParameter/WorkspaceParameter.js';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import NotificationParameters from 'services/user/notification_parameters.js';
import CreateWorkspacePage from 'app/scenes/Client/Popup/CreateWorkspacePage/CreateWorkspacePage.js';
import CompanyHeaderUI from 'app/scenes/Client/ChannelsBar/Parts/CurrentUser/CompanyHeader/CompanyHeader';
import ModalManagerDepreciated from 'services/popupManager/popupManager';
import Button from 'components/Buttons/Button.js';
import InitService from 'app/services/InitService';
import AccessRightsService from 'services/AccessRightsService';
import Workspaces from 'services/workspaces/workspaces.js';
import FeatureTogglesService, { FeatureNames } from 'app/services/FeatureTogglesService';
import LockedWorkspacePopup from 'app/components/LockedFeaturesComponents/LockedWorkspacePopup/LockedWorkspacePopup';
import ModalManager from 'app/components/Modal/ModalManager';
import CompanyMessagesCounter from 'components/CompanyMessagesCounter/CompanyMessagesCounter';
import RouterService from 'app/services/RouterService';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';
import ConsoleService from 'app/services/Console/ConsoleService';
import MenuCompanyHeader from './MenuCompanyHeader';
import { red } from '@material-ui/core/colors';
import SaveNewStatus from './SaveNewStatus';

export default class CurrentUser extends Component {
  constructor() {
    super();

    this.users_repository = Collections.get('users');
    this.i18n = Languages;

    this.state = {
      new_status: ['', ''],
      showingMenu: false,
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
    const new_status = {
      ...this.users_repository.known_objects_by_id[this.user_id].status.split(' '),
    };
    if (!new_status[0]) {
      new_status[1] = '';
    }
    this.setState({ new_status } || [new_status[0], '']);
  }

  async updateStatus(value) {
    value = value || this.state.new_status;
    await CurrentUserService.updateStatusIcon([
      value[0] === 'trash' ? '' : value[0],
      value[1] === 'trash' ? '' : value[1],
    ]);
    MenusManager.closeMenu();
    MenusManager.notify();
  }

  onClickUser(evt) {
    this.state.showingMenu ? this.hideMenu() : this.showMenu();
    this.setState({ showingMenu: !this.state.showingMenu });
  }

  hideMenu() {
    MenusManager.closeMenu();
  }

  showMenu() {
    var current_user = this.users_repository.known_objects_by_id[this.user_id];
    var usermenu = [
      {
        type: 'react-element',
        reactElement: () => <MenuCompanyHeader />,
      },
      { type: 'separator' },
      {
        type: 'react-element',
        className: 'menu-cancel-left-padding',
        reactElement: () => <CompanyMessagesCounter />,
      },
    ];

    if (
      !WorkspaceUserRights.isGroupInvite() &&
      (AccessRightsService.hasLevel(Workspaces.currentWorkspaceId, 'moderator') ||
        AccessRightsService.hasCompanyLevel(Workspaces.currentGroupId, 'admin'))
    ) {
      usermenu.push({ type: 'separator' });

      usermenu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.collaborateurs',
          [],
          'Collaborateurs',
        ),
        onClick: () => {
          ModalManagerDepreciated.open(
            <WorkspaceParameter initial_page={2} />,
            true,
            'workspace_parameters',
          );
        },
      });

      usermenu.push({
        type: 'menu',
        text: Languages.t(
          'scenes.app.channelsbar.currentuser.create_workspace_page',
          [],
          'Créer un espace de travail',
        ),
        onClick: () => {
          if (FeatureTogglesService.isActiveFeatureName(FeatureNames.MULTIPLE_WORKSPACES)) {
            ModalManagerDepreciated.open(<CreateWorkspacePage />);
          } else {
            ModalManager.open(
              <LockedWorkspacePopup />,
              {
                position: 'center',
                size: { width: '600px' },
              },
              false,
            );
          }
        },
      });
    }

    if (!WorkspaceUserRights.isInvite()) {
      if (WorkspaceUserRights.hasWorkspacePrivilege()) {
        usermenu.push(
          { type: 'separator' },
          {
            type: 'menu',
            text: Languages.t(
              'scenes.app.channelsbar.currentuser.workspace_parameters',
              [],
              "Paramètres de l'espace",
            ),
            onClick: () => {
              ModalManagerDepreciated.open(<WorkspaceParameter />, true, 'workspace_parameters');
            },
          },
        );

        if (
          AccessRightsService.hasCompanyLevel(WorkspaceService.currentGroupId, 'member') &&
          InitService.server_infos?.configuration?.accounts?.type === 'console'
        ) {
          usermenu.push({
            type: 'menu',
            text: Languages.t('scenes.app.popup.workspaceparameter.pages.company_identity_title'),
            rightIcon: 'external-link-alt',
            onClick: () => {
              return window.open(
                ConsoleService.getCompanyManagementUrl(WorkspaceService.currentGroupId),
                '_blank',
              );
            },
          });
        }
      }
    } else {
      usermenu.push(
        { type: 'separator' },
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

    usermenu = usermenu.concat([
      { type: 'separator' },

      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.currentuser.change_my_status'),
        emoji: this.state.new_status[0] || (current_user.status.split(' ') || {})[0] || ':smiley:',
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
              this.setState({
                new_status: [this.state.new_status[0], ''],
              });

              if (this.state.new_status[0].length <= 0) {
                this.setState({ new_status: current_user.status.split(' ') });
              }

              return (
                <InputWithIcon
                  focusOnDidMount
                  menu_level={level}
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
                <SaveNewStatus status={this.state.new_status} updateStatus={this.updateStatus} />
              );
            },
          },
        ],
      },
      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.currentuser.title', [], 'Paramètres du compte'),
        rightIcon:
          InitService.server_infos?.configuration?.accounts?.type === 'console'
            ? 'external-link-alt'
            : '',
        onClick: () => {
          if (InitService.server_infos?.configuration?.accounts?.type === 'console') {
            return window.open(
              InitService.server_infos?.configuration?.accounts?.console?.account_management_url,
              '_blank',
            );
          } else {
            ModalManagerDepreciated.open(<UserParameter />);
          }
        },
      },
      {
        type: 'menu',
        text: Languages.t('scenes.app.channelsbar.currentuser.logout', [], 'Se déconnecter'),
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
