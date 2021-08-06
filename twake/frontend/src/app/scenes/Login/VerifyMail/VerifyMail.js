import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import LoginService from 'services/login/login.js';
import AccountService from 'services/login/account';
import Emojione from 'components/Emojione/Emojione';
import WindowState from 'services/utils/window';

export default class VerifyMail extends Component {
  constructor() {
    super();

    this.state = {
      login: LoginService,
      i18n: Languages,
      status: 'pending',
    };
    LoginService.addListener(this);
    Languages.addListener(this);
  }
  componentDidMount() {
    AccountService.doVerifyMail(
      WindowState.findGetParameter('m'),
      WindowState.findGetParameter('c'),
      WindowState.findGetParameter('token'),
      () => {
        this.setState({ status: 'success' });
        document.location.replace('/');
        LoginService.init();
      },
      () => {
        this.setState({ status: 'error' });
      },
    );
  }
  componentWillUnmount() {
    LoginService.removeListener(this);
    Languages.removeListener(this);
  }
  render() {
    return (
      <div className="verify_mail">
        <div className="center_box_container login_view skew_in_bottom_nobounce">
          <div className="center_box white_box_with_shadow" style={{ width: '400px' }}>
            <div className="title">
              {Languages.t('scenes.login.verifymail.alert', [], 'Nous vérifions votre e-mail !')}
            </div>

            {this.state.status === 'pending' && (
              <div className="subtitle">
                <Emojione type=":hourglass:" />{' '}
                {Languages.t(
                  'scenes.login.verifymail.verification_waiting',
                  [],
                  'En attente de vérification...',
                )}
              </div>
            )}

            {this.state.status === 'success' && [
              <div className="subtitle">
                <Emojione type=":white_check_mark:" />{' '}
                {Languages.t(
                  'scenes.login.verifymail.success',
                  [],
                  'Votre e-mail a été vérifié avec succès!',
                )}
              </div>,
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a href="#" onClick={() => (document.location = '/')} className="blue_link">
                {Languages.t('scenes.login.verifymail.signin_button', [], 'Se connecter')}
              </a>,
            ]}

            {this.state.status === 'error' && [
              <div className="subtitle">
                <Emojione type=":confused:" />{' '}
                {Languages.t(
                  'scenes.login.verifymail.error_message',
                  [],
                  "Une erreur s'est produite",
                )}
              </div>,
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <a
                onClick={() => {
                  LoginService.changeState('signin');
                  document.location.replace('/');
                }}
                className="blue_link"
              >
                {this.state.i18n.t('scenes.login.home.create_account')}
              </a>,
            ]}
          </div>
        </div>
      </div>
    );
  }
}
