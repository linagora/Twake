import UserServiceAPI from "../services/user/api";
import { User, Workspace } from "./types";
import Company from "../services/user/entities/company";
import CompanyUser from "../services/user/entities/company_user";
import WorkspaceUser from "../services/workspaces/entities/workspace_user";
import { hasCompanyAdminLevel } from "./company";

export async function isWorkspaceAdmin(
  userService: UserServiceAPI,
  user?: User,
  workspace?: Workspace,
): Promise<boolean> {
  if (!user || !workspace) {
    return false;
  }

  const companyUser = await userService.companies.getCompanyUser(
    { id: workspace.company_id },
    { id: user.id },
  );
  if (companyUser && hasCompanyAdminLevel(companyUser.role)) {
    return true;
  }

  const workspaceUser = await getWorkspaceUser(userService, user, workspace);

  if (!workspaceUser) {
    return false;
  }

  return workspaceUser.role === "moderator";
}

export function hasWorkspaceAdminLevel(role: string): boolean {
  return role === "admin";
}

export function hasWorkspaceMemberLevel(role: string): boolean {
  return role === "member" || hasWorkspaceAdminLevel(role);
}

export async function getWorkspaceUser(
  userService: UserServiceAPI,
  user?: User,
  workspace?: Workspace,
): Promise<WorkspaceUser> {
  if (!user || !workspace) {
    return null;
  }

  const workspaceUser = await userService.workspaces.getUser({
    workspaceId: workspace.workspace_id,
    userId: user.id,
  });

  return workspaceUser;
}

export async function getCompanyUser(
  userService: UserServiceAPI,
  user?: User,
  company?: Company,
): Promise<CompanyUser> {
  if (!user || !company) {
    return null;
  }

  const companyUser = await userService.companies.getCompanyUser(
    {
      id: company.id,
    },
    {
      id: user.id,
    },
  );

  return companyUser;
}
