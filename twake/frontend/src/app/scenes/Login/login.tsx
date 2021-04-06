import React, { useEffect, useState } from 'react';

import Globals from 'services/Globals.js';
import Languages from 'services/languages/languages.js';
import InitService from 'services/InitService';
import LoginService from 'services/login/login.js';
import Icon from 'components/Icon/Icon.js';
import InteractiveLoginBackground from 'components/InteractiveLoginBackground/InteractiveLoginBackground.js';
import './login.scss';

import LoginView from './LoginView/LoginView.js';
import Signin from './Signin/Signin.js';
import VerifyMail from './VerifyMail/VerifyMail.js';
import ForgotPassword from './ForgotPassword/ForgotPassword.js';
import Error from './Error/Error';

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

  return (
    <div className={'loginPage'}>
      {server_infos_loaded && !server_infos.branding.name && <div className="twake_logo" />}

      {['logged_out', 'signin', 'forgot_password'].indexOf(LoginService.state) != -1 && (
        <InteractiveLoginBackground />
      )}

      {LoginService.state == 'error' && <Error />}
      {LoginService.state == 'logged_out' && <LoginView />}
      {LoginService.state == 'signin' && <Signin />}
      {LoginService.state == 'verify_mail' && <VerifyMail />}
      {LoginService.state == 'forgot_password' && <ForgotPassword />}

      <div className="white_background light_background" />
      <div className={'app_version_footer '}>
        <div className="version_name fade_in">Twake {(Globals.window as any)?.version_name}</div>
        <div style={{ height: 20 }}>
          {server_infos_loaded && server_infos.branding.name && (
            <div className="smalltext fade_in">
              {server_infos.branding.name &&
                Languages.t('scenes.login.footer.branding', [
                  server_infos.branding.name,
                  server_infos.branding.link || 'twake.app',
                ])}
              <a target="_BLANK" href="https://twakeapp.com">
                {Languages.t('scenes.login.footer.go_to_twake')}
              </a>
              {' - ' + (Globals.window as any)?.version}
            </div>
          )}
          {server_infos_loaded && !server_infos.branding.name && (
            <a className="fade_in" target="_BLANK" href="https://twakeapp.com">
              {Languages.t('scenes.login.footer.go_to_twake')}
            </a>
          )}
        </div>
      </div>

      <div className={'help_footer'}>
        {server_infos_loaded && server_infos.help_link && (
          <a
            href={'' + InitService.server_infos.help_link}
            target="_BLANK"
            className="blue_link fade_in"
          >
            <Icon type="question-circle" /> {Languages.t('general.help')}
          </a>
        )}
      </div>
    </div>
  );
};
