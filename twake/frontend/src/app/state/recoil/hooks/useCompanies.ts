import { CompaniesState } from '../atoms/Companies';
import useRouterCompany from './useRouterCompany';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../atoms/CurrentUser';

export const useCompanies = () => {
  const [user] = useRecoilState(CurrentUserState);
  return { companies: user?.companies || [] };
};

export const useCurrentCompany = () => {
  const routerCompanyId = useRouterCompany();
  const [company] = useRecoilState(CompaniesState(routerCompanyId));
  return { company };
};
