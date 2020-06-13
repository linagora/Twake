import React, {Component} from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import LoginService from 'services/login/login.js';
import loginService from 'services/login/login.js';
import popupManager from 'services/popupManager/popupManager.js';
import userService from 'services/user/user.js';
import currentUserService from 'services/user/current_user.js';
import WorkspaceApps from './Pages/WorkspaceApps.js';
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
    if (this.state.page == 1) {
      return <WorkspaceApps />;
    }
    if (this.state.page == 2) {
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
                  text: 'Vos applications',
                  emoji: ':control_knobs:',
                  selected: this.state.page == 1,
                  onClick: () => this.setPage(1),
                },
                {
                  type: 'menu',
                  text: 'Twacode tester',
                  emoji: ':love_letter:',
                  selected: this.state.page == 2,
                  onClick: () => this.setPage(2),
                },
                {
                  type: 'menu',
                  text: 'Retour',
                  icon: 'arrow-left',
                  onClick: () => popupManager.close(),
                },
              ]}
            />
          </div>

          <div className="content">{this.displayScene()}</div>
        </div>
        {/*<div className="bottom">
            <div className="return">
              <a className="blue_link"  onClick={()=>this.previous()}>{this.state.i18n.t("general.cancel")}</a>
            </div>
            <ButtonWithTimeout className="small " disabled={false} onClick={()=>console.log("click")} loading={false} value={this.state.i18n.t("general.update")} />
          </div>*/}
      </div>
    );
  }
}
