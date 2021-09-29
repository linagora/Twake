import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import LoginService from 'app/services/login/LoginService';

import Languages from 'services/languages/languages';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupManager from 'services/popupManager/popupManager.js';

import CreateCompanyView from '../CreateCompanyView/CreateCompanyView.js';
import SecondMail from '../SecondMail/SecondMail.js';
import InitService from 'services/InitService';

import './WelcomePage.scss';
import Api from 'app/services/Api.js';

export default class WelcomePage extends Component {
  private retrying: boolean = false;
  constructor(props: {}) {
    super(props);
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
  displayPage(page: number) {
    const auth = InitService.server_infos?.configuration?.accounts;

    if (page === 1) {
      return (
        <div className="">
          <div className="title">
            <Emojione type=":tada:" s64 />{' '}
            {Languages.t('scenes.app.workspaces.welcome_page.welcome_header')}
          </div>
          <div className="subtitle">
            {Languages.t('scenes.app.workspaces.welcome_page.no_company_subtitle')}{' '}
            <Emojione type=":crying_cat_face:" />
          </div>

          {auth?.type === 'internal' && (
            <div
              className="button big"
              onClick={() => Workspaces.openCreateCompanyPage(<CreateCompanyView />)}
            >
              {Languages.t('scenes.app.workspaces.welcome_page.create_my_company')}
            </div>
          )}

          <div className="retry">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="link" onClick={() => this.retry()}>
              {Languages.t('scenes.app.workspaces.welcome_page.try_again')}
            </a>
          </div>

          <div className="otherMail text">
            {auth?.type === 'internal' && (
              <>
                <div className="label">
                  {Languages.t(
                    'scenes.app.workspaces.welcome_page.may_be_invited_with_secondary_emails',
                  )}
                </div>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
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
                  {Languages.t('scenes.app.workspaces.welcome_page.add_secondary_emails')}
                </a>
              </>
            )}
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className="blue_link" onClick={() => LoginService.logout()}>
              {Languages.t('scenes.apps.account.account.logout')}
            </a>
          </div>
        </div>
      );
    }
    if (page === 2) {
      if (!Groups.currentGroupId || !Collections.get('groups').find(Groups.currentGroupId)) {
        popupManager.closeAll();
        return '';
      }
      return (
        <div className="">
          <div className="title">
            <Emojione type=":tada:" s64 />{' '}
            {Languages.t('scenes.app.workspaces.welcome_page.welcome_header')}
          </div>
          <div className="subtitle">
            {Languages.t('scenes.app.workspaces.welcome_page.added_to_company')}{' '}
            <b>{Collections.get('groups').find(Groups.currentGroupId).name}</b>.
            <br />
            {Languages.t('scenes.app.workspaces.welcome_page.ready_to_work')}{' '}
            <Emojione type=":briefcase: " />
            <br />
            {Languages.t('scenes.app.workspaces.welcome_page.see_you_soon')}{' '}
            <Emojione type=":wave:" />
            <div className="signed">
              {Languages.t('scenes.app.workspaces.welcome_page.twake_team')}
            </div>
          </div>
          <div className="btn blueBtn" onClick={() => Workspaces.closeWelcomePage(true)}>
            {Languages.t('scenes.app.workspaces.welcome_page.lets_go')}
          </div>
        </div>
      );
    }
  }
  render() {
    return (
      <div className="welcomePage">
        <div className=" skew_in_top_nobounce">
          {this.displayPage(Object.keys(Workspaces.user_workspaces).length > 0 ? 2 : 1)}
        </div>
      </div>
    );
  }
}
