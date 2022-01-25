import React, { Component } from 'react';

import Emojione from 'components/emojione/emojione';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import LoginService from 'app/services/login/LoginService';

import Languages from 'services/languages/languages';
import Groups from 'services/workspaces/groups.js';
import Workspaces from 'services/workspaces/workspaces.js';
import popupManager from 'services/popupManager/popupManager.js';

import CreateCompanyView from '../../../popup/CreateCompanyView/CreateCompanyView.js';
import SecondMail from '../../../popup/SecondMail/SecondMail.js';
import InitService from 'services/InitService';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import CompanySelector from '../CompanySelector/index';

import './styles.scss';

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

  render() {
    const auth = InitService.server_infos?.configuration?.accounts;
    return (
      <div className="welcomePage">
        <div className=" skew_in_top_nobounce">
          <div className="">
            <div className="title">
              <Emojione type=":tada:" s64 />{' '}
              {Languages.t('scenes.app.workspaces.welcome_page.welcome_header')}
            </div>
            <div className="subtitle">
              {Languages.t('scenes.app.workspaces.welcome_page.no_company_subtitle')}{' '}
              <Emojione type=":crying_cat_face:" />
            </div>

            <div className="retry">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a href="#" className="link" onClick={() => this.retry()}>
                {Languages.t('scenes.app.workspaces.welcome_page.try_again')}
              </a>
            </div>

            <div className="otherMail text">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a className="blue_link" onClick={() => LoginService.logout()}>
                {Languages.t('scenes.apps.account.account.logout')}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
