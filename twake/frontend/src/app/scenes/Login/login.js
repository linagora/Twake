import React, { Component } from 'react';

import Globals from 'services/Globals.js';
import Languages from 'services/languages/languages.js';
import LoginService from 'services/login/login.js';
import Icon from 'components/Icon/Icon.js';
import InteractiveLoginBackground from 'components/InteractiveLoginBackground/InteractiveLoginBackground.js';
import './login.scss';

import LoginView from './LoginView/LoginView.js';
import Signin from './Signin/Signin.js';
import VerifyMail from './VerifyMail/VerifyMail.js';
import ForgotPassword from './ForgotPassword/ForgotPassword.js';

export default class Login extends Component {
  constructor() {
    super();

    this.state = {
      login: LoginService,
      i18n: Languages,
    };

    LoginService.addListener(this);
    Languages.addListener(this);
  }
  componentWillMount() {
    document.body.classList.add('fade_in');
  }
  componentWillUnmount() {
    document.body.classList.remove('fade_in');
    LoginService.removeListener(this);
    Languages.removeListener(this);
  }
  render() {
    // if(this.state.login.state== "signin"){
    //     return (<Signin />)
    // }
    // return(<WelcomePage/>)
    return (
      <div className={'loginPage ' + (this.props.willGoToApp ? 'willGoToApp ' : '')}>
        <div className="twake_logo" />

        {['logged_out', 'signin', 'forgot_password'].indexOf(this.state.login.state) != -1 && (
          <InteractiveLoginBackground />
        )}

        {this.state.login.state == 'logged_out' && <LoginView />}
        {this.state.login.state == 'signin' && <Signin />}
        {this.state.login.state == 'verify_mail' && <VerifyMail />}
        {this.state.login.state == 'forgot_password' && <ForgotPassword />}

        <div className="white_background light_background" />
        <div className={'app_version_footer ' + (this.props.willGoToApp ? 'fade_out ' : '')}>
          <div className="version_name fade_in">
            Twake {Globals.window.version} {Globals.window.version_name}
          </div>
          <div style={{ height: 20 }}>
            {this.state.login.server_infos_loaded && this.state.login.server_infos.branding.name && (
              <div className="smalltext fade_in">
                {this.state.login.server_infos.branding.name &&
                  this.state.i18n.t('scenes.login.footer.branding', [
                    this.state.login.server_infos.branding.name,
                    this.state.login.server_infos.branding.link,
                  ])}
                <a target="_BLANK" href="https://twakeapp.com">
                  {this.state.i18n.t('scenes.login.footer.go_to_twake')}
                </a>
              </div>
            )}
            {this.state.login.server_infos_loaded && !this.state.login.server_infos.branding.name && (
              <a className="fade_in" target="_BLANK" href="https://twakeapp.com">
                {this.state.i18n.t('scenes.login.footer.go_to_twake')}
              </a>
            )}
          </div>
        </div>

        <div className={'help_footer ' + (this.props.willGoToApp ? 'fade_out ' : '')}>
          {this.state.login.server_infos_loaded && this.state.login.server_infos.help_link && (
            <a
              href={LoginService.server_infos.help_link}
              target="_BLANK"
              className="blue_link fade_in"
            >
              <Icon type="question-circle" /> {this.state.i18n.t('general.help')}
            </a>
          )}
        </div>
      </div>
    );
  }
}
