import React, { Component } from 'react';
import Emojione from 'components/emojione/emojione';
import LoginService from 'app/features/auth/login-service';
import Languages from 'app/features/global/services/languages-service';
import Groups from 'app/deprecated/workspaces/groups.js';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import GotALink from './GotALink';

import './styles.scss';

export default class WelcomePage extends Component<unknown> {
  private retrying = false;
  constructor(props: unknown) {
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

            <GotALink />

            <div className="retry">
              <a href="#" className="link" onClick={() => this.retry()}>
                {Languages.t('scenes.app.workspaces.welcome_page.try_again')}
              </a>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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
