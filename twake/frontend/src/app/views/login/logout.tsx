// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';

import LoginService from 'app/services/login/LoginService';

export default () => {
  useEffect(() => {
    async function logout() {
      // check if already connected
      await LoginService.logout();
    }

    logout();
  }, []);

  return <></>;
};