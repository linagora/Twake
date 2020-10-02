import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import LoginService from 'services/login/login.js';
import loginService from 'services/login/login.js';
import popupManager from 'services/popupManager/popupManager.js';
import userService from 'services/user/user.js';
import currentUserService from 'services/user/current_user.js';
import WorkspaceIdentity from './Pages/WorkspaceIdentity.js';
import WorkspacePartner from './Pages/WorkspacePartner.js';
import CompanyIdendity from './Pages/CompanyIdendity.js';
import WorkspaceApps from './Pages/WorkspaceApps.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import WorkspaceService from 'services/workspaces/workspaces.js';
import MenuList from 'components/Menus/MenuComponent.js';
import './WorkspaceParameter.scss';

export default class WorkspaceParameter extends Component {
  constructor(props) {
    super(props);
    var user = Collections.get('users').find(userService.getCurrentUserId());
    this.state = {
      login: LoginService,
      i18n: Languages,
      users_repository: Collections.get('users'),
      workspace_user_rights: WorkspaceUserRights,
      loginService: loginService,
      currentUserService: currentUserService,
      page: popupManager.popupStates['workspace_parameters'] || props.initial_page || 1,
      attributeOpen: 0,
      subMenuOpened: 0,
      username: user ? user.username : '',
      lastname: user ? user.lastname : '',
      firstname: user ? user.firstname : '',
      thumbnail: false,
      options: this.props.options,
    };
    Collections.get('users').addListener(this);
    Collections.get('users').listenOnly(this, [
      Collections.get('users').find(userService.getCurrentUserId()).front_id,
    ]);
    LoginService.addListener(this);
    Languages.addListener(this);
    WorkspaceUserRights.addListener(this);
    currentUserService.addListener(this);
  }
  componentWillMount() {
    this.state.thumbnail = false;
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
    Languages.removeListener(this);
    WorkspaceUserRights.removeListener(this);
    currentUserService.removeListener(this);
    Collections.get('users').removeListener(this);
  }
  displayScene() {
    if (WorkspaceUserRights.hasWorkspacePrivilege() && this.state.page == 1) {
      return <WorkspaceIdentity />;
    }
    if (this.state.page == 2) {
      return <WorkspacePartner />;
    }
    if (WorkspaceUserRights.hasWorkspacePrivilege() && this.state.page == 3) {
      var options = this.state.options;
      if (this.state.options == 'open_search_apps') {
        this.state.options = undefined;
      }
      return <WorkspaceApps searchApps={options == 'open_search_apps'} />;
    }
    if (WorkspaceUserRights.hasGroupPrivilege('MANAGE_DATA') && this.state.page == 4) {
      return <CompanyIdendity />;
    }
    if (this.state.page == 5) {
      return (
        <div className="">
          <div className="title">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.payments_subscriptions_title',
              [],
              'Paiements et abonnements',
            )}
          </div>

          <div className="group_section" />
        </div>
      );
    }
  }

  setPage(page) {
    popupManager.popupStates['workspace_parameters'] = page;
    this.setState({ page: page });
  }
  render() {
    var subText = (
      <div>
        {Languages.t(
          'scenes.app.channelsbar.currentuser.workspace_info',
          [
            Collections.get('workspaces').find(WorkspaceService.currentWorkspaceId).name,
            Collections.get('groups').find(WorkspaceService.currentGroupId).name,
          ],
          "Vous êtes dans l'espace de travail $1 du groupe $2.",
        )}
        <br />
        <br />
        {WorkspaceUserRights.hasWorkspacePrivilege() &&
          WorkspaceUserRights.hasGroupPrivilege('MANAGE_PRICINGS') && (
            <span>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.admin_manager_current_status',
                [],
                "Vous êtes Administrateur et Gérant de l'entreprise.",
              )}
            </span>
          )}
        {WorkspaceUserRights.hasWorkspacePrivilege() &&
          !WorkspaceUserRights.hasGroupPrivilege('MANAGE_PRICINGS') && (
            <span>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.admin_current_status',
                [],
                'Vous êtes Administrateur.',
              )}
            </span>
          )}
        {!WorkspaceUserRights.hasWorkspacePrivilege() &&
          WorkspaceUserRights.hasGroupPrivilege('MANAGE_PRICINGS') && (
            <span>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.manager_current_status',
                [],
                "Vous êtes Gérant de l'entreprise.",
              )}
            </span>
          )}
      </div>
    );

    var menu = [];

    if (WorkspaceUserRights.hasWorkspacePrivilege()) {
      menu.push({
        type: 'menu',
        emoji: ':house_with_garden:',
        text: Languages.t(
          'scenes.apps.parameters.workspace_sections.workspace',
          [],
          'Espace de travail',
        ),
        selected: this.state.page == 1 ? 'selected' : '',
        onClick: () => {
          this.setPage(1);
        },
      });
      menu.push({
        type: 'menu',
        emoji: ':electric_plug:',
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.apps_connectors_title',
          [],
          'Applications et connecteurs',
        ),
        selected: this.state.page == 3 ? 'selected' : '',
        onClick: () => {
          this.setPage(3);
        },
      });
    }
    menu.push({
      type: 'menu',
      emoji: ':handshake:',
      text: Languages.t(
        'scenes.app.popup.workspaceparameter.pages.collaborateurs',
        [],
        'Collaborateurs',
      ),
      selected: this.state.page == 2 ? 'selected' : '',
      onClick: () => {
        this.setPage(2);
      },
    });

    if (WorkspaceUserRights.hasGroupPrivilege('MANAGE_DATA')) {
      menu.push({ type: 'separator' });
      menu.push({
        type: 'menu',
        emoji: ':clipboard:',
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.company_identity_title',
          [],
          "Identité de l'entreprise",
        ),
        selected: this.state.page == 4 ? 'selected' : '',
        onClick: () => {
          this.setPage(4);
        },
      });
    }

    /*if(WorkspaceUserRights.hasWorkspacePrivilege("MANAGE_PRICINGS")){
        menu.push({type: "menu", emoji: ":moneybag:", text:"Paiements et abonnements", selected: (this.state.page==5?"selected":""), onClick: ()=>{this.setPage(5)}});
      }*/

    menu.push({ type: 'text', text: subText });

    return (
      <div className="workspaceParameter fade_in">
        <div className="main">
          <div className="sideBar">
            <MenuList menu={menu} />
          </div>
          <div className="content">{this.displayScene()}</div>
        </div>
      </div>
    );
  }
}
