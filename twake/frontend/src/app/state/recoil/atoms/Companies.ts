import { atomFamily } from 'recoil';
import Collections from 'app/services/Depreciated/Collections/Collections';

import { CompanyType } from 'app/models/Company';
import CompanyAPIClient from 'app/services/CompanyAPIClient';
import _ from 'lodash';

export const CompaniesState = atomFamily<CompanyType | null, string>({
  key: 'CompaniesState',
  default: id => (id ? CompanyAPIClient.get(id) : null),

  //Retro compatibility
  effects_UNSTABLE: id => [
    ({ onSet }) => {
      onSet(company => Collections.get('groups').updateObject(_.cloneDeep(company)));
    },
  ],
});
