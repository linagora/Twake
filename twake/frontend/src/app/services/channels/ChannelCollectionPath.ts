const prefix = "/channels/v1/companies";
type WorkspaceId = string | "direct";

/**
 * All channels path
 * 
 * @param companyId 
 * @param workspaceId 
 * @returns 
 */
export const getChannels = (companyId: string = "", workspaceId: WorkspaceId = "direct"): string => (`${prefix}/${companyId}/workspaces/${workspaceId}/channels`);

/**
 * Get direct channels path for given company
 * 
 * @param companyId 
 * @returns 
 */
export const getDirectChannels = (companyId: string = ""): string => (getChannels(companyId, "direct"));

/**
 * Current user channels path
 * 
 * @param companyId 
 * @param workspaceId 
 * @returns 
 */
export const getMine = (companyId: string = "", workspaceId: WorkspaceId = "direct"): string => (`${getChannels(companyId, workspaceId)}/::mine`);
