import { validate as validateUuid } from "uuid";

export function checkCompanyAndWorkspaceForUser(
  companyId: string,
  workspaceId: string,
): Promise<boolean> {
  return Promise.resolve(validateUuid(companyId) && validateUuid(workspaceId));
}
