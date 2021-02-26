import { Workspace, User } from "../services/types";

export function isWorkspaceAdmin(user?: User, workspace?: Workspace): boolean {
  if (!user || !workspace) {
    return false;
  }

  if (!user.org) {
    return false;
  }

  if (!user.org[workspace.company_id]) {
    return false;
  }

  const company = user.org[workspace.company_id];

  if (!company.wks[workspace.workspace_id]) {
    return false;
  }

  return company.wks[workspace.workspace_id].adm;
}
