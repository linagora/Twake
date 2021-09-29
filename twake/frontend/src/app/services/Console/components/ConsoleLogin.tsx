// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';
import LoginService from 'services/login/login';

export default () => {
  useEffect(() => {
    LoginService.init();
  }, []);
  return <></>;
};
