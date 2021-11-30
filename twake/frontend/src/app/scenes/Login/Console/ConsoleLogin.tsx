// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useCurrentUser } from 'app/state/recoil/hooks/useCurrentUser';

export default () => {
  useCurrentUser();
  return <></>;
};
