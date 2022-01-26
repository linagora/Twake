import React, { useEffect } from 'react';
import { Typography } from 'antd';

import Globals from 'app/features/global/services/globals-twake-app-service';
import Languages from 'app/features/global/services/languages-service';
import InitService from 'app/features/global/services/init-service';
import LoginService from 'app/features/auth/login-service';
import Icon from 'app/components/icon/icon.js';

import LoginView from './login-view/login-view.js';
import Signin from './signin/signin.js';
import VerifyMail from './verify-mail/verify-mail.js';
import ForgotPassword from './forgot-password/index.js';
import Error from './error';

import './login.scss';

export default () => {
  LoginService.useListener();
  Languages.useListener();
  const [server_infos_loaded, server_infos] = InitService.useWatcher(() => [
    InitService.server_infos_loaded,
    InitService.server_infos,
  ]);

  useEffect(() => {
    LoginService.init();
    document.body.classList.remove('fade_out');
    document.body.classList.add('fade_in');
    return () => {
      document.body.classList.remove('fade_in');
    };
  }, []);

  if (!server_infos_loaded) {
    return <div />;
  }

  return (
    <div className="loginPage">
      {server_infos_loaded && !server_infos?.configuration?.branding?.name && (
        <div className="twake_logo" />
      )}

      {LoginService.state === 'error' && <Error />}
      {LoginService.state === 'logged_out' && <LoginView />}
      {LoginService.state === 'signin' && <Signin />}
      {LoginService.state === 'verify_mail' && <VerifyMail />}
      {LoginService.state === 'forgot_password' && <ForgotPassword />}

      <div className={'app_version_footer '}>
        <div className="version_name fade_in">Twake {Globals.version.version_name}</div>
        <div style={{ height: 20 }}>
          {server_infos_loaded && server_infos?.configuration?.branding?.name && (
            <div className="smalltext fade_in">
              {server_infos?.configuration?.branding?.name &&
                Languages.t('scenes.login.footer.branding', [
                  server_infos?.configuration?.branding?.name,
                  server_infos?.configuration?.branding.link || 'twake.app',
                ])}
              <Typography.Link onClick={() => window.open('https://twakeapp.com', 'blank')}>
                {Languages.t('scenes.login.footer.go_to_twake')}
              </Typography.Link>
              {' - ' + Globals.version.version}
            </div>
          )}
          {server_infos_loaded && !server_infos?.configuration?.branding?.name && (
            <Typography.Link
              className="fade_in"
              onClick={() => window.open('https://twakeapp.com', 'blank')}
            >
              {Languages.t('scenes.login.footer.go_to_twake')}
            </Typography.Link>
          )}
        </div>
      </div>

      <div className={'help_footer'}>
        {server_infos_loaded && server_infos?.configuration?.help_url && (
          <Typography.Link
            onClick={() =>
              window.open(InitService.server_infos?.configuration?.help_url || '', 'blank')
            }
            className="blue_link fade_in"
          >
            <Icon type="question-circle" /> {Languages.t('general.help')}
          </Typography.Link>
        )}
      </div>
    </div>
  );
};
