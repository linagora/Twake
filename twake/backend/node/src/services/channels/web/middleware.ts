export function checkCompanyAndWorkspaceForUser(
  companyId: string,
  workspaceId: string,
): Promise<boolean> {
  return Promise.resolve(companyId === "0" && workspaceId === "0");
}
