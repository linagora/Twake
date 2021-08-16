// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';

import InitService from 'services/InitService';
import LoginService from 'services/login/login';
import InteractiveLoginBackground from 'components/InteractiveLoginBackground/InteractiveLoginBackground';
import LoginView from './LoginView/LoginView';
import Signin from './Signin/Signin';
import VerifyMail from './VerifyMail/VerifyMail';
import ForgotPassword from './ForgotPassword/ForgotPassword';
import Error from './Error/Error';
import LoginFooter from './Footer/LoginFooter';

import './login.scss';

export default () => {
  LoginService.useListener(useState);
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
    <div className={'loginPage'}>
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

      {server_infos_loaded && <LoginFooter serverInfo={server_infos}/>}
    </div>
  );
};
