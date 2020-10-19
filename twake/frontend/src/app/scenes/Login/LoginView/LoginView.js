import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import LoginService from 'services/login/login.js';
import Emojione from 'components/Emojione/Emojione';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

export default class LoginView extends Component {
  constructor() {
    super();

    this.state = {
      login: LoginService,
      i18n: Languages,
    };

    LoginService.addListener(this);
    Languages.addListener(this);
  }
  componentDidMount() {
    if (
      ((LoginService.server_infos || {}).auth || []).length > 0 &&
      ((LoginService.server_infos || {}).auth || []).indexOf('internal') < 0 &&
      !(LoginService.external_login_error || false)
    ) {
      LoginService.loginWithExternalProvider(((LoginService.server_infos || {}).auth || [])[0]);
    }
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
    Languages.removeListener(this);
  }
  render() {
    const login = this.state.login;

    return (
      <div className="center_box_container login_view skew_in_bottom_nobounce">
        <div className="center_box white_box_with_shadow">
          <div className="title">
            {!((LoginService.server_infos || {}).branding || {}).logo &&
              this.state.i18n.t('scenes.login.home.title')}
          </div>

          {!((LoginService.server_infos || {}).branding || {}).logo && (
            <div className="subtitle" style={{ marginBottom: 24 }}>
              {this.state.i18n.t('scenes.login.home.subtitle')} <Emojione type=":innocent:" />
            </div>
          )}

          {!!((LoginService.server_infos || {}).branding || {}).logo && (
            <img
              style={{ marginBottom: 40, marginTop: 10, width: 140 }}
              src={((LoginService.server_infos || {}).branding || {}).logo}
            />
          )}

          {Object.keys((login.server_infos || {}).auth || []).indexOf('cas') >= 0 && (
            <div class="external-login" style={{ marginBottom: 16 }}>
              <Button
                id="login_btn"
                type="button"
                className="medium full_width "
                style={{ marginBottom: 8 }}
                disabled={this.state.login.login_loading}
                onClick={() => LoginService.loginWithExternalProvider('cas')}
              >
                {this.state.i18n.t('scenes.login.home.login_external_btn', ['CAS'])}
              </Button>
            </div>
          )}

          {Object.keys((login.server_infos || {}).auth || []).indexOf('openid') >= 0 && (
            <div class="external-login" style={{ marginBottom: 16 }}>
              <Button
                id="login_btn"
                type="button"
                className="medium full_width "
                style={{ marginBottom: 8 }}
                disabled={this.state.login.login_loading}
                onClick={() => LoginService.loginWithExternalProvider('openid')}
              >
                {this.state.i18n.t('scenes.login.home.login_external_btn', ['OpenID'])}
              </Button>
            </div>
          )}

          {this.state.login.external_login_error && (
            <div id="identification_information" className="smalltext error">
              Unable to login: {this.state.login.external_login_error}
            </div>
          )}

          {(Object.keys((login.server_infos || {}).auth || []).indexOf('internal') >= 0 ||
            ((login.server_infos || {}).auth || []).length == 0) && (
            <div class="internal-login">
              <Input
                id="username"
                type="text"
                className={
                  'bottom-margin medium full_width ' +
                  (this.state.login.login_error ? 'error ' : '')
                }
                placeholder={this.state.i18n.t('scenes.login.home.email')}
                onKeyDown={e => {
                  if (e.keyCode == 13 && !this.state.login.login_loading) {
                    LoginService.login(this.state.form_login, this.state.form_password, true);
                  }
                }}
                onChange={evt => this.setState({ form_login: evt.target.value })}
              />

              <Input
                id="password"
                type="password"
                className={
                  'bottom-margin medium full_width ' +
                  (this.state.login.login_error ? 'error ' : '')
                }
                placeholder={this.state.i18n.t('scenes.login.home.password')}
                onKeyDown={e => {
                  if (e.keyCode == 13 && !this.state.login.login_loading) {
                    LoginService.login(this.state.form_login, this.state.form_password, true);
                  }
                }}
                onChange={evt => this.setState({ form_password: evt.target.value })}
              />

              {this.state.login.login_error && (
                <div id="identification_information" className="smalltext error">
                  {this.state.i18n.t('scenes.login.home.unable_to_connect')}
                </div>
              )}

              <Button
                id="login_btn"
                type="button"
                className="medium full_width "
                style={{ marginBottom: 8 }}
                disabled={this.state.login.login_loading}
                onClick={() =>
                  LoginService.login(this.state.form_login, this.state.form_password, true)
                }
              >
                {this.state.i18n.t('scenes.login.home.login_btn')}
              </Button>
              {!(((LoginService.server_infos || {}).auth || {}).internal || {})
                .disable_account_creation && (
                <a
                  onClick={() => this.state.login.changeState('signin')}
                  id="create_btn"
                  className="blue_link"
                >
                  {this.state.i18n.t('scenes.login.home.create_account')}
                </a>
              )}

              <a
                onClick={() => this.state.login.changeState('forgot_password')}
                id="forgot_password_btn"
                className="blue_link"
              >
                {this.state.i18n.t('scenes.login.home.lost_password')}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }
}
