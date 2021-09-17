// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect, useState } from 'react';

import InitService from 'services/InitService';
import LoginService, { LoginState } from 'services/login/LoginService';
import InteractiveLoginBackground from 'components/InteractiveLoginBackground/InteractiveLoginBackground';
import LoginView from './LoginView/LoginView';
import Signin from './Signin/Signin';
import WindowState from 'services/utils/window';
import VerifyMail from './VerifyMail/VerifyMail';
import ForgotPassword from './ForgotPassword/ForgotPassword';
import Error from './Error/Error';
import LoginFooter from './Footer/LoginFooter';

import './login.scss';

const useWindowState = () => {
  const [params, setParams] = useState<LoginState>('');

  useEffect(() => {
    if (WindowState.hasParameter('error')) {
      setParams('error');
      return;
    }

    if (WindowState.hasParameter('subscribe')) {
      setParams('signin');
      return;
    }

    if (WindowState.hasParameter('verifyMail')) {
      setParams('verify_mail');
      return;
    }

    if (WindowState.hasParameter('forgotPassword')) {
      setParams('forgot_password');
      return;
    }

    if (WindowState.hasParameter('logout')) {
      setParams('logout');
      return;
    }
  }, []);

  return {
    params,
  };
};

export default () => {
  const windowState = useWindowState();

  LoginService.useListener(useState);
  const [server_infos_loaded, server_infos] = InitService.useWatcher(() => [
    InitService.server_infos_loaded,
    InitService.server_infos,
  ]);

  useEffect(() => {
    document.body.classList.add('fade_in');
    return () => document.body.classList.remove('fade_in');
  }, []);


  if (windowState.params === 'logout') {
    // FIXME: Can be dangerous...
    LoginService.logout();
    return;
  }

  if (!server_infos_loaded) {
    return <div />;
  }

  return (
    <div className='loginPage'>
      {server_infos_loaded && !server_infos?.configuration?.branding?.name && (
        <div className="twake_logo" />
      )}

      {(['', 'signin', 'forgot_password'].includes(windowState.params)) ? <InteractiveLoginBackground /> : <></>}

      {(windowState.params === '') && <LoginView />}
      {(LoginService.state === 'error' || windowState.params === 'error') && <Error />}
      {(LoginService.state === 'signin' || windowState.params === 'signin') && <Signin />}
      {(LoginService.state === 'verify_mail' || windowState.params === 'verify_mail') && <VerifyMail />}
      {(LoginService.state === 'forgot_password' || windowState.params === 'forgot_password') && <ForgotPassword />}

      {server_infos_loaded && <LoginFooter serverInfo={server_infos}/>}
    </div>
  );
};
