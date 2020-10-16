import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione';
import Collections from 'services/Collections/Collections.js';
import LoginService from 'services/login/login.js';

import Languages from 'services/languages/languages.js';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupManager from 'services/popupManager/popupManager.js';

import CreateCompanyView from '../CreateCompanyView/CreateCompanyView.js';
import SecondMail from '../SecondMail/SecondMail.js';

import './WelcomePage.scss';

export default class WelcomePage extends Component {
  constructor() {
    super();
    this.state = {
      i18n: Languages,
      workspaces: Workspaces,
      group: Groups,
      page: 1,
    };
    Languages.addListener(this);
    Workspaces.addListener(this);
    Groups.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Workspaces.removeListener(this);
    Groups.removeListener(this);
  }
  retry() {
    if (!this.retrying) {
      this.retrying = true;
      LoginService.init();
      setTimeout(() => {
        this.retrying = false;
      });
    }
  }
  displayPage(page) {
    if (page == 1) {
      return (
        <div className="">
          <div className="title">
            <Emojione type=":tada:" s64 />{' '}
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.welcome_header')}
          </div>
          <div className="subtitle">
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.no_company_subtitle')}{' '}
            <Emojione type=":crying_cat_face:" />
          </div>
          <div
            className="button big"
            onClick={() => this.state.workspaces.openCreateCompanyPage(<CreateCompanyView />)}
          >
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.create_my_company')}
          </div>

          <div className="retry">
            <a href="#" className="link" onClick={() => this.retry()}>
              {this.state.i18n.t('scenes.app.workspaces.welcome_page.try_again')}
            </a>
          </div>

          <div className="otherMail text">
            <div className="label">
              {this.state.i18n.t(
                'scenes.app.workspaces.welcome_page.may_be_invited_with_secondary_emails',
              )}
            </div>
            <a
              className="blue_link"
              onClick={() =>
                popupManager.open(
                  <SecondMail
                    onReturn={() => {
                      this.retry();
                      this.setState({ page: 1 });
                    }}
                  />,
                )
              }
            >
              {this.state.i18n.t(
                'scenes.app.workspaces.welcome_page.add_secondary_emails',
                'workspace_parameters',
              )}
            </a>
          </div>
        </div>
      );
    }
    if (page == 2) {
      if (
        !this.state.group.currentGroupId ||
        !Collections.get('groups').find(this.state.group.currentGroupId)
      ) {
        return '';
      }
      return (
        <div className="">
          <div className="title">
            <Emojione type=":tada:" s64 />{' '}
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.welcome_header')}
          </div>
          <div className="subtitle">
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.added_to_company')}{' '}
            <b>{Collections.get('groups').find(this.state.group.currentGroupId).name}</b>.
            <br />
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.ready_to_work')}{' '}
            <Emojione type=":briefcase: " />
            <br />
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.see_you_soon')}{' '}
            <Emojione type=":wave:" />
            <div className="signed">
              {this.state.i18n.t('scenes.app.workspaces.welcome_page.twake_team')}
            </div>
          </div>
          <div className="btn blueBtn" onClick={() => this.state.workspaces.closeWelcomePage(true)}>
            {this.state.i18n.t('scenes.app.workspaces.welcome_page.lets_go')}
          </div>
        </div>
      );
    }
  }
  render() {
    return (
      <div className="welcomePage">
        <div className=" skew_in_top_nobounce">
          {this.displayPage(Object.keys(this.state.workspaces.user_workspaces).length > 0 ? 2 : 1)}
        </div>
      </div>
    );
  }
}
