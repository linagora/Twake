import { atomFamily } from 'recoil';
import Collections from 'app/services/Depreciated/Collections/Collections';

import { CompanyType } from 'app/models/Company';
import UserAPIClient from 'app/services/user/UserAPIClient';

export const CompaniesState = atomFamily<CompanyType, string>({
  key: 'CompaniesState',
  default: id => {
    return UserAPIClient.getCompany(id);
  },

  //Retrocompatibility
  effects_UNSTABLE: id => [
    ({ onSet }) => {
      onSet(company => Collections.get('groups').updateObject(company));
    },
  ],
});
