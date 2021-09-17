import { useSetRecoilState } from "recoil";

import { CurrentUserState } from "app/state/recoil/atoms/CurrentUser";
import LoginService from "./LoginService";
import Logger from 'services/Logger';

const logger = Logger.getLogger('useLogin');

export const useLogin = () => {
  const setUser = useSetRecoilState(CurrentUserState);

  function init() {
    LoginService.init()
      .then(user => {
        logger.debug('Initialized');
        if (user) {
          setUser(user);
        }
        // TODO: redirect
      })
      .catch(err => logger.error('Error while initializing loginService', err));
  }

  function login(params: any) {
    LoginService.login(params).then(user => {
      setUser(user);
      // TODO: localstorage?
      // TODO: Push history
    });

  }

  function logout() {
    LoginService.logout()
      .then(() => {
        setUser(undefined);
      })
      .catch(err => {});
  }

  return {
    init,
    login,
    logout,
  };
};
