import { atomFamily } from 'recoil';
import Collections from 'app/services/Depreciated/Collections/Collections';

import { CompanyType } from 'app/models/Company';
import UserAPIClient from 'app/services/user/UserAPIClient';
import _ from 'lodash';

export const CompaniesState = atomFamily<CompanyType, string>({
  key: 'CompaniesState',
  default: id => UserAPIClient.getCompany(id),

  //Retro compatibility
  effects_UNSTABLE: id => [
    ({ onSet }) => {
      onSet(company => Collections.get('groups').updateObject(_.cloneDeep(company)));
    },
  ],
});
