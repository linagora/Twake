import { CompanyType } from 'app/models/Company';
import { UserType } from 'app/models/User';
import { WorkspaceType } from 'app/models/Workspace';
import LocalStorage from 'app/services/LocalStorage';
import RouterService from 'app/services/RouterService';

/**
 * Company priority:
 * 1. Router company id
 * 2. Local storage company id
 * 3. User's company with the most total members
 *
 * @param user
 * @returns CompanyType | undefined
 */
export function getBestCandidateCompany(user: UserType): CompanyType | undefined {
  const { companyId } = RouterService.getStateFromRoute();
  const storageCompanyId = (LocalStorage.getItem('default_company_id') as string) || null;

  return (
    user.companies?.find(o => o.company.id === companyId)?.company ||
    user.companies?.find(o => o.company.id === storageCompanyId)?.company ||
    user.companies?.sort(
      (a, b) => (a.company?.stats?.total_members || 0) - (b.company?.stats?.total_members || 0),
    )[0].company
  );
}

/**
 * Workspace priority:
 * 1. Router workspace id
 * 2. Local storage workspace id
 * 3. User's workspace with the most total members
 *
 * @param userWorkspaces
 * @returns WorkspaceType | undefined
 */
export function getBestCandidateWorkspace(
  userWorkspaces: WorkspaceType[],
): WorkspaceType | undefined {
  const { workspaceId } = RouterService.getStateFromRoute();
  const storageWorkspaceId = (LocalStorage.getItem('default_workspace_id') as string) || null;

  return (
    userWorkspaces?.find(w => w.id === workspaceId) ||
    userWorkspaces?.find(w => w.id === storageWorkspaceId) ||
    userWorkspaces?.sort((a, b) => a?.stats?.total_members - b.stats?.total_members)[0] ||
    userWorkspaces[0]
  );
}
