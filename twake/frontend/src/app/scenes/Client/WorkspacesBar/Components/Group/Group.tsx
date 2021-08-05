// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import { useRecoilValue } from 'recoil';

import Group from './_Group.jsx';
import { CurrentCompanyState } from 'app/state/recoil/atoms/CurrentCompany';

export default (): JSX.Element => {
  const company = useRecoilValue(CurrentCompanyState);

  return (company
    ? <Group id={company.id} />
    : <></>
  );
};
