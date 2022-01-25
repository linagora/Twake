// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React, { useEffect } from 'react';
import { useOnlineUsers } from 'app/features/users/hooks/use-online-users';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import UserNotifications from 'app/features/users/services/user-notifications-service';

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
