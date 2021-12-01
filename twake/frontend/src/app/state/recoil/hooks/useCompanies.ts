import { CompaniesState } from '../atoms/Companies';
import useRouterCompany from './useRouterCompany';
import { useRecoilState } from 'recoil';
import { CurrentUserState } from '../atoms/CurrentUser';
import { CompanyType } from 'app/models/Company';
import LocalStorage from 'app/services/LocalStorage';
import { UserType } from 'app/models/User';
import { useCurrentUser } from './useCurrentUser';
import _ from 'lodash';
import RouterService from 'app/services/RouterService';
import WorkspacesService from 'services/workspaces/workspaces.js';
import UserNotifications from 'app/services/user/UserNotifications';
import AccessRightsService from 'app/services/AccessRightsService';
import Groups from 'services/workspaces/groups.js';
import LoginService from 'app/services/login/LoginService';
import UserAPIClient from 'app/services/user/UserAPIClient';

/**
 * Will return the companies of the current user
 */
export const useCompanies = () => {
  const [user] = useRecoilState(CurrentUserState);

  const refresh = async () => {
    await LoginService.updateUser();
  };

  return { companies: user?.companies || [], refresh };
};

/**
 * Will return the requested company
 */
export const useCompany = (companyId: string) => {
  const [company, setCompany] = useRecoilState(CompaniesState(companyId));

  const refresh = async () => {
    setCompany(await UserAPIClient.getCompany(companyId));
  };

  return { company, refresh };
};

/**
 * Will return the currently visible company and select one if nothing is already selected
 */
export const useCurrentCompany = () => {
  const user = useCurrentUser().user;
  const bestCandidate = useBestCandidateCompany(user)?.id || '';

  //Get current route company and verify it is available to the user
  let routerCompanyId = useRouterCompany();
  if (!user?.companies?.find(c => c.company.id === routerCompanyId)) routerCompanyId = '';

  //If there is no company for this user, display the no company page
  if (user?.companies?.length === 0) {
    WorkspacesService.openNoWorkspacesPage();
  }

  //If there is nothing in router or company in router isn't available for the user, try to use the best candidate available
  if (!routerCompanyId && bestCandidate) {
    RouterService.push(RouterService.generateRouteFromState({ companyId: bestCandidate }));
  }

  const [company] = useRecoilState(CompaniesState(routerCompanyId));

  //Always set the current company in localstorage to open it automatically later
  if (routerCompanyId) {
    //Depreciated retrocompatibility
    Groups.addToUser(company);
    AccessRightsService.updateCompanyLevel(
      company.id,
      company.role === 'admin' || company.role === 'owner'
        ? 'admin'
        : company.role === 'guest'
        ? 'guest'
        : 'member',
    );
    //End of depreciated

    LocalStorage.setItem('default_company_id', routerCompanyId);
  }

  return { company };
};

/**
 * Company priority:
 * 1. Router company id
 * 2. Local storage company id
 * 3. User's company with the most total members
 *
 * @param user
 * @returns CompanyType | undefined
 */
export function useBestCandidateCompany(user: UserType | undefined): CompanyType | undefined {
  const routerCompanyId = useRouterCompany();
  const storageCompanyId = (LocalStorage.getItem('default_company_id') as string) || null;

  if (!user) {
    return undefined;
  }

  const companies = _.cloneDeep(user.companies || []);

  return (
    companies.find(o => o.company.id === routerCompanyId)?.company ||
    companies.find(o => o.company.id === storageCompanyId)?.company ||
    companies.sort(
      (a, b) => (a.company?.stats?.total_members || 0) - (b.company?.stats?.total_members || 0),
    )[0].company
  );
}
