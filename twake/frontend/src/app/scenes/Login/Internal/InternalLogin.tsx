import React, { useEffect, useState } from 'react';

import Globals from 'services/Globals';
import Languages from 'services/languages/languages';
import InitService from 'services/InitService';
import LoginService from 'app/services/login/LoginService';
import Icon from 'components/Icon/Icon.js';
import InteractiveLoginBackground from 'components/InteractiveLoginBackground/InteractiveLoginBackground.js';
import './login.scss';

import LoginView from './LoginView/LoginView.js';
import Signin from './Signin/Signin.js';
import VerifyMail from './VerifyMail/VerifyMail.js';
import ForgotPassword from './ForgotPassword/ForgotPassword.js';
import Error from './Error/Error';
import { Typography } from 'antd';

export default () => {
  LoginService.useListener(useState);
  Languages.useListener(useState);
  const [server_infos_loaded, server_infos] = InitService.useWatcher(() => [
    InitService.server_infos_loaded,
    InitService.server_infos,
  ]);

  useEffect(() => {
    LoginService.init();
    document.body.classList.add('fade_in');
    return () => {
      document.body.classList.remove('fade_in');
    };
  }, []);

  if (!server_infos_loaded) {
    return <div />;
  }

  return (
    <div className='loginPage'>
      {server_infos_loaded && !server_infos?.configuration?.branding?.name && (
        <div className="twake_logo" />
      )}

      {['logged_out', 'signin', 'forgot_password'].indexOf(LoginService.state) !== -1 && (
        <InteractiveLoginBackground />
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
