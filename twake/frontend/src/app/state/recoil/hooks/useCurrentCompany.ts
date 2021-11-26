import { SetterOrUpdater, useRecoilState, useRecoilValue } from 'recoil';

import { CompanyType } from 'app/models/Company';
import { CurrentCompanyState } from '../atoms/CurrentCompany';
import useRouterCompany from './useRouterCompany';
import Groups from 'app/services/workspaces/groups';

export const useCurrentCompany = (): [CompanyType | undefined] => {
  const routerCompanyId = useRouterCompany();

  const company = (Groups.user_groups as any)[routerCompanyId] as CompanyType;

  return [company];
};
