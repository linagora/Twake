// eslint-disable-next-line no-use-before-define
import { Component } from 'react';

import MenusManager from 'app/components/menus/menus-manager.js';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import ModalManagerDepreciated from 'app/deprecated/popupManager/popupManager';
import NotificationParameters from 'app/deprecated/user/notification_parameters.js';
import LoginService from 'app/features/auth/login-service';
import FeatureTogglesService, {
  FeatureNames,
} from 'app/features/global/services/feature-toggles-service';
import Languages from 'app/features/global/services/languages-service';
import UserService from 'app/features/users/services/current-user-service';
import ListenUsers from 'app/features/users/services/listen-users-service';
import WorkspacesUsers from 'app/features/workspace-members/services/workspace-members-service';
import WorkspaceUserRights from 'app/features/workspaces/services/workspace-user-rights-service';
import CompanyHeaderUI from 'app/views/client/channels-bar/Parts/CurrentUser/CompanyHeader/CompanyHeader';
import WorkspaceParameter from 'app/views/client/popup/WorkspaceParameter/parameters';
import CompanyMessagesCounter from 'components/company-messages-counter/company-messages-counter';
import MenuCompanyHeader from './MenuCompanyHeader';
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

  onClickUser(evt) {
    this.showMenu();
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
    ];

    if (!FeatureTogglesService.isActiveFeatureName(FeatureNames.MESSAGE_HISTORY)) {
      usermenu.push(
        ...[
          { type: 'separator' },
          {
            type: 'react-element',
            className: 'menu-cancel-left-padding',
            reactElement: () => <CompanyMessagesCounter />,
          },
        ],
      );
    }

    if (WorkspaceUserRights.isInvite()) {
      usermenu.push(
        { type: 'separator' },
        {
          type: 'text',
          text: Languages.t('scenes.app.channelsbar.currentuser.invited_status'),
        },
        {
          type: 'menu',
          icon: 'plane-fly',
          text: Languages.t('scenes.app.popup.workspaceparameter.pages.quit_workspace_menu'),
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
        emoji: (current_user.status.split(' ') || {})[0] || ':smiley:',
        submenu_replace: false,
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
              return <SaveNewStatus level={level} />;
            },
          },
        ],
      },
      {
        type: 'menu',
        icon: 'user',
        text: Languages.t('scenes.app.channelsbar.currentuser.title', [], 'Paramètres du compte'),
        onClick: () => {
          ModalManagerDepreciated.open(
            <WorkspaceParameter initial_page={11} />,
            true,
            'account_parameters',
          );
        },
      },
      {
        type: 'menu',
        icon: 'sign-out-alt',
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
