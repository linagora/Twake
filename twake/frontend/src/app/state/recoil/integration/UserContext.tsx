// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';
import { useOnlineUsers } from 'app/services/OnlineUser/useOnlineUsers';
import useRouterCompany from '../hooks/useRouterCompany';
import UserNotifications from 'app/services/user/UserNotifications';

/**
 * This hook will be global to application
 */
export default (): JSX.Element => {
  useOnlineUsers();

  const routerCompanyId = useRouterCompany();
  useEffect(() => {
    UserNotifications.subscribeToCurrentCompanyNotifications(routerCompanyId);
  }, [routerCompanyId]);

  return <></>;
};
