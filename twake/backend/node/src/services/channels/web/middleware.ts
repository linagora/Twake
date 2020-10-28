export function checkCompanyAndWorkspaceForUser(companyId: string, workspaceId: string): Promise<boolean> {
  return Promise.resolve(/*companyId === "0" && workspaceId === "0"*/ true); //not using uuid-v4 now 
}
