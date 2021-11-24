import { AtomEffect, atomFamily, selectorFamily } from 'recoil';

import { Application } from 'app/models/App';
import Logger from 'app/services/Logger';
import CompanyApplicationsAPIClient from 'app/services/Apps/CompanyApplicationsAPIClient';

const logger = Logger.getLogger('CurrentCompanyApplicationsState');

//Retro compatibility
const companyApplicationMap: Map<string, Application> = new Map();
const companyApplicationsMap: Map<string, Application[]> = new Map();
export const getCompanyApplication = (applicationId: string) => {
  return companyApplicationMap.get(applicationId);
};
export const getCompanyApplications = (companyId: string) => {
  return companyApplicationsMap.get(companyId) || [];
};
const depreciatedEffect = (companyId: string): AtomEffect<Application[]>[] => [
  ({ onSet }) => {
    onSet((applications: Application[]) => {
      companyApplicationsMap.set(companyId, applications);
      (applications || []).forEach(a => companyApplicationMap.set(a.id, a));
    });
  },
];
//Ends retro compatibility

export const CompanyApplicationsStateFamily = atomFamily<Application[], string>({
  key: 'CompanyApplicationsStateFamily',
  default: companyId => fetchCompanyApplications(companyId),
  effects_UNSTABLE: depreciatedEffect,
});

export const fetchCompanyApplications = selectorFamily<Application[], string>({
  key: 'fetchCompanyApplications',
  get: companyId => async () => {
    logger.debug('fetchCompanyApplications', companyId);
    return (await CompanyApplicationsAPIClient.list(companyId)) || [];
  },
});
