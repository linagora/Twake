const prefix = "/channels/v1/companies/";
type WorkspaceId = string | "direct";

/**
 * All channels path
 * 
 * @param companyId 
 * @param workspaceId 
 * @returns 
 */
export const getChannels = (companyId: string, workspaceId: WorkspaceId = "direct") => (`${prefix}/${companyId}/workspaces/${workspaceId}/channels`);

/**
 * Current user channels path
 * 
 * @param companyId 
 * @param workspaceId 
 * @returns 
 */
export const getMine = (companyId: string, workspaceId: WorkspaceId = "direct"): string => (`${getChannels(companyId, workspaceId)}/::mine`);
