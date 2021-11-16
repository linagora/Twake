import { atom, atomFamily, selectorFamily } from 'recoil';

import { Application } from 'app/models/App';
import Logger from 'app/services/Logger';
import CompanyApplicationsAPIClient from 'app/services/Apps/CompanyApplicationsAPIClient';

const logger = Logger.getLogger('CurrentCompanyApplicationsState');

export const CurrentCompanyApplicationsState = atom<Application[] | undefined>({
  key: 'CurrentCompanyApplicationsState',
  default: undefined,
});

export const CompanyApplicationsStateFamily = atomFamily<Application[], string>({
  key: 'CompanyApplicationsStateFamily',
  default: companyId => fetchCompanyApplications(companyId),
});

export const fetchCompanyApplications = selectorFamily<Application[], string>({
  key: 'fetchCompanyApplications',
  get: companyId => async () => {
    logger.debug('fetchCompanyApplications', companyId);
    return (await CompanyApplicationsAPIClient.list(companyId)) || [];
  },
});
