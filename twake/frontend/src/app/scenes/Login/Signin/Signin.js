import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import LoginService from 'services/login/login.js';
import AccountService from 'services/login/account';
import Emojione from 'components/Emojione/Emojione';
import StepCounter from 'components/StepCounter/StepCounter.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Input from 'components/Inputs/Input.js';
import Checkbox from 'components/Inputs/Checkbox.js';
import InitService from 'services/InitService';
export default class Signin extends Component {
  constructor() {
    super();

    this.state = {
      login: LoginService,
      i18n: Languages,
      username: '',
      email: LoginService.emailInit,
      password: '',
      name: '',
      firstName: '',
      phone: '',
      code: '',
      newsletter: true,
      page: 1,
      invalidForm: false,
      patternRegMail: new RegExp(
        "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?",
      ),
      mailAvailable: true,
      usernameAvailable: true,
      errorMail: false,
      errorUsername: false,
      errorPassword: false,
      errorCode: false,
    };
    LoginService.addListener(this);
    Languages.addListener(this);
  }
  componentDidMount() {
    if (this.input) {
      this.input.focus();
    }
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
    Languages.removeListener(this);
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      (prevState.page === 1 && this.state.page === 2) ||
      (prevState.page === 2 && this.state.page === 3 && this.input)
    ) {
      this.input.focus();
    }
  }
  displayStep() {
    if (this.state.page === 1) {
      return (
        <div className="">
          <div className="subtitle">
            {this.state.i18n.t('scenes.login.create_account.step_1_subtitle')}{' '}
            <Emojione type=":smile:" />
          </div>

          {this.state.login.error_subscribe_username && this.state.username && (
            <div className={'error text bottom-margin'}>
              {this.state.i18n.t('scenes.login.create_account.username_already_exist')}
            </div>
          )}
          {this.state.username && this.state.errorUsername && (
            <div className={'text error bottom-margin'}>
              {this.state.i18n.t('scenes.login.create_account.fill_in_username')}
            </div>
          )}
          <Input
            onBlur={() => this.updateFieldError('errorUsername', () => this.checkUsername())}
            refInput={ref => {
              this.input = ref;
            }}
            id="username_create"
            className={
              'bottom-margin medium full_width ' + (this.state.errorUsername ? 'error' : '')
            }
            onKeyDown={e => {
              if (e.keyCode === 13) {
                this.next();
              }
            }}
            placeholder={this.state.i18n.t('scenes.login.create_account.username')}
            value={this.state.username}
            onChange={evt => this.setState({ username: evt.target.value })}
          />

          {this.state.login.error_subscribe_mailalreadyused && this.state.email && (
            <div className="text error bottom-margin">
              {this.state.i18n.t('scenes.login.create_account.email_used')}
            </div>
          )}
          {this.state.errorMail && (
            <div className={'text error bottom-margin'}>
              {this.state.i18n.t('scenes.login.create_account.fill_in_email')}
            </div>
          )}
          <Input
            onBlur={() => this.updateFieldError('errorMail', () => this.checkMail())}
            id="email_create"
            className={
              'bottom-margin medium full_width ' +
              (this.state.login.error_subscribe_mailalreadyused ? 'error' : '')
            }
            onKeyDown={e => {
              if (e.keyCode === 13) {
                this.next();
              }
            }}
            placeholder={this.state.i18n.t('scenes.login.create_account.email')}
            value={this.state.email}
            onChange={evt => this.setState({ email: evt.target.value })}
          />

          {this.state.errorPassword && (
            <div className={'text error bottom-margin'}>
              {this.state.i18n.t('scenes.login.create_account.too_short_password')}
            </div>
          )}
          <Input
            onBlur={() => this.updateFieldError('errorPassword', () => this.checkPassword())}
            id="password_create"
            type="password"
            className={
              'bottom-margin medium full_width ' + (this.state.errorPassword ? 'error' : '')
            }
            onKeyDown={e => {
              if (e.keyCode === 13) {
                this.next();
              }
            }}
            placeholder={this.state.i18n.t('scenes.login.create_account.password')}
            value={this.state.password}
            onChange={evt => this.setState({ password: evt.target.value })}
          />
          <div className="bottom">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="returnBtn blue_link" onClick={() => this.previous()}>
              {this.state.i18n.t('general.back')}
            </a>
            <ButtonWithTimeout
              id="continue_btn"
              medium
              disabled={!this.checkForm() || this.state.login.login_loading}
              onClick={() => this.next()}
              value={this.state.i18n.t('general.continue')}
              loading={this.state.login.login_loading}
              loadingTimeout={2000}
            />
          </div>
        </div>
      );
    }
    if (this.state.page === 2) {
      return (
        <div className="">
          <div className="subtitle">
            {this.state.i18n.t('scenes.login.create_account.step_2_subtitle_a')}{' '}
            <Emojione type=":raised_hand:" />
          </div>
          {(!InitService.server_infos?.configuration?.branding?.name ||
            InitService.server_infos?.configuration?.branding.enable_newsletter) &&
            ((InitService.server_infos || {}).branding || {}).enable_newsletter !== false && (
              <div className="subtitle">
                {this.state.i18n.t('scenes.login.create_account.step_2_subtitle_b')}
              </div>
            )}

          <Input
            id="lastname_create"
            refInput={ref => {
              this.input = ref;
            }}
            className="bottom-margin medium full_width"
            onKeyDown={e => {
              if (e.keyCode === 13) {
                this.next();
              }
            }}
            placeholder={this.state.i18n.t('scenes.login.create_account.lastname')}
            value={this.state.name}
            onChange={evt => this.setState({ name: evt.target.value })}
          />
          <Input
            id="firstname_create"
            className="bottom-margin medium full_width"
            onKeyDown={e => {
              if (e.keyCode === 13) {
                this.next();
              }
            }}
            placeholder={this.state.i18n.t('scenes.login.create_account.firstname')}
            value={this.state.firstName}
            onChange={evt => this.setState({ firstName: evt.target.value })}
          />
          {(!InitService.server_infos?.configuration?.branding?.name ||
            InitService.server_infos?.configuration?.branding.enable_newsletter) &&
            ((InitService.server_infos || {}).branding || {}).enable_newsletter !== false && [
              <Input
                key="phone"
                id="phone_number_create"
                className="bottom-margin medium full_width"
                onKeyDown={e => {
                  if (e.keyCode === 13) {
                    this.next();
                  }
                }}
                placeholder={'+11 1 23 45 67 89'}
                value={this.state.phone}
                onChange={evt => this.setState({ phone: evt.target.value })}
              />,
              <Checkbox
                key="newsletter"
                small
                value={this.state.newsletter}
                onChange={value => {
                  this.setState({ newsletter: value });
                }}
                label={this.state.i18n.t('scenes.login.create_account.newsletter')}
              />,
            ]}

          <div className="bottom">
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a href="#" className="returnBtn blue_link" onClick={() => this.previous()}>
              {this.state.i18n.t('general.back')}
            </a>
            <ButtonWithTimeout
              id="continue2_btn"
              medium
              disabled={this.state.login.login_loading}
              onClick={() => this.next()}
              value={this.state.i18n.t('general.continue')}
              loading={this.state.login.login_loading}
              loadingTimeout={2000}
            />
          </div>
        </div>
      );
    }
    if (
      this.state.page === 3 &&
      !InitService.server_infos?.configuration?.accounts?.type ===
        'internal'.disable_email_verification
    ) {
      return (
        <div>
          <div className="subtitle">
            {this.state.i18n.t('scenes.login.create_account.step_3_subtitle')}{' '}
            <Emojione type=":robot:" />
          </div>

          <div className="big_emoji">
            <Emojione type=":love_letter:" s64 />
          </div>
          <br />
          <br />

          <div className="subtitle" style={{ marginBottom: 0 }}>
            {this.state.i18n.t('scenes.login.create_account.step_3_mail_sent')}
          </div>

          <br />

          <ButtonWithTimeout
            medium
            style={{ width: 'auto' }}
            onClick={() => {
              this.subscribeMail();
            }}
            value={'Send again'}
            loading={this.state.login.login_loading}
            loadingTimeout={2000}
          />
        </div>
      );
    }
    if (
      this.state.page === 3 &&
      InitService.server_infos?.configuration?.accounts?.type ===
        'internal'.disable_email_verification
    ) {
      return (
        <div className="">
          <div className="subtitle">
            <Emojione type=":hourglass:" />{' '}
          </div>
        </div>
      );
    }
  }

  updateFieldError(stateName, test) {
    this.setState({ [stateName]: !test() });
  }

  checkUsername = () => {
    return !(this.state.username.length <= 1);
  };

  checkMail = () => {
    return !!this.state.patternRegMail.test(this.state.email.toLocaleLowerCase());
  };

  checkPassword = () => {
    return this.state.password.length >= 8;
  };

  checkForm() {
    return this.checkUsername() && this.checkMail() && this.checkPassword();
  }

  previous() {
    if (this.state.page <= 1) {
      this.state.login.changeState('logged_out');
    } else {
      this.setState({ page: this.state.page - 1 });
    }
  }
  subscribeMail() {
    AccountService.subscribeMail(
      this.state.username,
      this.state.password,
      this.state.name,
      this.state.firstName,
      this.state.phone,
      this.state.email,
      this.state.newsletter,
      this.sub,
      this,
    );
  }
  next() {
    if (this.state.page === 1) {
      if (this.checkForm()) {
        AccountService.checkMailandUsername(
          this.state.email,
          this.state.username,
          (th, value) => {
            if (value === 0) {
              this.setState({ page: this.state.page + 1 });
            } else {
              this.setState({});
            }
          },
          this,
        );
      }
    } else if (this.state.page === 2) {
      this.subscribeMail();
    } else {
      this.setState({ page: this.state.page + 1 });
    }
  }
  sub(that, state) {
    // that.login(username, password, 1);
    if (state === 0) {
      that.setState({ page: 3 });
    }
    if (state === 1) {
      that.setState({ page: 1 });
      that.state.errorSub = true;
    }
  }
  checkAvailable(that, numError) {
    switch (numError) {
      case 0:
        that.setState({ page: 2 });
        break;
      case 1:
        that.setState({ invalidForm: true });
        that.setState({ mailAvailable: false });
        break;
      case 2:
        that.setState({ invalidForm: true });
        that.setState({ usernameAvailable: false });
        break;
      case 3:
        that.setState({ invalidForm: true });
        that.setState({ mailAvailable: false });
        that.setState({ usernameAvailable: false });
        break;
      default:
        break;
    }
  }
  render() {
    return (
      <div className="signin">
        <div className="center_box_container login_view skew_in_bottom_nobounce">
          <div className="center_box white_box_with_shadow" style={{ width: '400px' }}>
            <StepCounter total={3} current={this.state.page} />
            <div className="title">
              {this.state.i18n.t('scenes.login.create_account.title')} {this.state.page}/3
            </div>
            {this.displayStep()}
          </div>
        </div>
      </div>
    );
  }
}
