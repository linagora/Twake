// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';

import { useCurrentCompany } from 'app/state/recoil/hooks/useCurrentCompany';

import Group from './_Group.jsx';

export default (): JSX.Element => {
  const [company] = useCurrentCompany();

  return company ? <Group id={company.id} /> : <></>;
};
