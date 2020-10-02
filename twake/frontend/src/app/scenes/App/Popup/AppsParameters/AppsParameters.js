import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import LoginService from 'services/login/login.js';
import loginService from 'services/login/login.js';
import popupManager from 'services/popupManager/popupManager.js';
import userService from 'services/user/user.js';
import currentUserService from 'services/user/current_user.js';
import WorkspaceApps from './Pages/WorkspaceApps.js';
import WorkspaceAppsInformations from './Pages/WorkspaceAppsInformations.js';
import TwacodeTester from './Pages/TwacodeTester.js';
import MenuList from 'components/Menus/MenuComponent.js';
import './AppsParameters.scss';

export default class AppsParameters extends Component {
  constructor(props) {
    super(props);
    var user = Collections.get('users').find(userService.getCurrentUserId());
    this.state = {
      login: LoginService,
      i18n: Languages,
      users_repository: Collections.get('users'),
      loginService: loginService,
      currentUserService: currentUserService,
      page: props.initial_page || 1,
      attributeOpen: 0,
      subMenuOpened: 0,
      username: user ? user.username : '',
      lastname: user ? user.lastname : '',
      firstname: user ? user.firstname : '',
      thumbnail: false,
    };
    Collections.get('users').addListener(this);
    Collections.get('users').listenOnly(this, [
      Collections.get('users').find(userService.getCurrentUserId()).front_id,
    ]);
    LoginService.addListener(this);
    Languages.addListener(this);
    currentUserService.addListener(this);
  }
  componentWillMount() {
    this.state.thumbnail = false;
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
    Languages.removeListener(this);
    currentUserService.removeListener(this);
    Collections.get('users').removeListener(this);
  }
  displayScene() {
    switch (this.state.page) {
      case 1:
        return <WorkspaceApps />;
      case 2:
        return <WorkspaceAppsInformations />;
      case 3:
        return <TwacodeTester />;
    }
  }

  setPage(page) {
    this.setState({ page: page });
  }
  render() {
    return (
      <div className="appsParameters fade_in">
        <div className="main">
          <div className="sideBar">
            <MenuList
              menu={[
                {
                  type: 'menu',
                  text: Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.your_apps_label',
                    [],
                    'Vos applications',
                  ),
                  emoji: ':control_knobs:',
                  selected: this.state.page == 1,
                  onClick: () => this.setPage(1),
                },
                {
                  type: 'menu',
                  text: 'Basic informations',
                  emoji: ':information_source:',
                  selected: this.state.page == 2,
                  onClick: () => this.setPage(2),
                },
                {
                  type: 'menu',
                  text: 'Twacode tester',
                  emoji: ':love_letter:',
                  selected: this.state.page == 3,
                  onClick: () => this.setPage(3),
                },
                {
                  type: 'menu',
                  text: Languages.t('general.back', [], 'Retour'),
                  icon: 'arrow-left',
                  onClick: () => popupManager.close(),
                },
              ]}
            />
          </div>

          <div className="content">{this.displayScene()}</div>
        </div>
      </div>
    );
  }
}
