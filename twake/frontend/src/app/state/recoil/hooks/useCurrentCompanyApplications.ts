import { useEffect, useRef, useState } from 'react';

import { useRecoilState } from 'recoil';

import Logger from 'app/services/Logger';
import Languages from 'services/languages/languages';
import { ToasterService as Toaster } from 'app/services/Toaster';
import { CompanyApplicationsStateFamily } from '../atoms/CurrentCompanyApplications';
import CompanyApplicationsAPIClient from 'app/services/Apps/CompanyApplicationsAPIClient';

const logger = Logger.getLogger('useCurrentCompanyApplications');
export function useCurrentCompanyApplications(companyId: string) {
  const [companyApplications, setCompanyApplications] = useRecoilState(
    CompanyApplicationsStateFamily(companyId),
  );
  const [isLoadingCompanyApplications, setIsLoadingCompanyApplications] = useState(false);

  const handleCompanyApplicationsChanges = useRef(async (companyId: string) => {
    setIsLoadingCompanyApplications(true);
    logger.debug(`Proccessing changes for company applications in `, companyId);

    try {
      const res = await CompanyApplicationsAPIClient.list(companyId);

      res && setCompanyApplications(res);
    } catch (e) {
      logger.error(`Error while trying to handle company applications changes`, e);
    }

    setIsLoadingCompanyApplications(false);
  });

  const deleteOneCompanyApplication = async (applicationId: string) => {
    logger.debug(`Proccessing delete company application ${applicationId} in company `, companyId);
    setIsLoadingCompanyApplications(true);

    try {
      const application = await CompanyApplicationsAPIClient.get(companyId, applicationId);

      await CompanyApplicationsAPIClient.remove(companyId, applicationId);

      handleCompanyApplicationsChanges.current(companyId);
      Toaster.success(
        Languages.t('app.state.recoil.hooks.use_current_company_applications.toaster_delete', [
          application.identity.name,
        ]),
      );
    } catch (e) {
      logger.error(`Error while trying to delete one company application`, e);
    }

    setIsLoadingCompanyApplications(false);
  };

  const addOneCompanyApplication = async (applicationId: string) => {
    logger.debug(`Proccessing add company application ${applicationId} in company `, companyId);
    setIsLoadingCompanyApplications(true);

    try {
      await CompanyApplicationsAPIClient.add(companyId, applicationId);

      handleCompanyApplicationsChanges.current(companyId);

      const application = await CompanyApplicationsAPIClient.get(companyId, applicationId);
      Toaster.success(
        Languages.t('app.state.recoil.hooks.use_current_company_applications.toaster_add', [
          application.identity.name,
        ]),
      );
    } catch (e) {
      logger.error(`Error while trying to add one company application`, e);
    }

    setIsLoadingCompanyApplications(false);
  };

  const isApplicationInstalledInCompany = (applicationId: string) =>
    companyApplications.map(a => a.id).filter(id => applicationId === id)[0] ? true : false;

  useEffect(() => {
    handleCompanyApplicationsChanges.current(companyId);
  }, [companyId]);

  return {
    companyApplications,
    isLoadingCompanyApplications,
    addOneCompanyApplication,
    deleteOneCompanyApplication,
    isApplicationInstalledInCompany,
  };
}