// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import RouterService from 'app/services/RouterService';

export default () => {
  const { user } = useCurrentUser();
  if (user) RouterService.push(RouterService.generateRouteFromState({}));
  return <></>;
};
