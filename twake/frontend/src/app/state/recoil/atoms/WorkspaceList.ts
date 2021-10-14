import { atomFamily, selectorFamily, useRecoilCallback, useRecoilState, useSetRecoilState } from "recoil";
import { WorkspaceType } from "app/models/Workspace";
import WorkspaceAPIClient from "app/services/workspaces/WorkspaceAPIClient";
import Logger from "app/services/Logger";

const logger = Logger.getLogger("WorkspaceListState");

export const WorkspaceListStateFamily = atomFamily<WorkspaceType[], string>({
  key: 'WorkspaceListStateFamily',
  default: (companyId) => fetchCompanyWorkspaces(companyId),
});

export const WorkspaceGetOrFetch = selectorFamily<WorkspaceType | undefined, {companyId: string, workspaceId: string}>({
  key: 'WorkspaceGet',
  get: ({ companyId, workspaceId }) => async ({ get }) => {
    // FIXME: This fails because we use hook out of hook context
    const setWorkspaces = useSetRecoilState(WorkspaceListStateFamily(companyId));
    let result = get(WorkspaceListStateFamily(companyId)).find(ws => ws.id === workspaceId && ws.company_id === companyId);

    if (result) {
      return result;
    }

    try {
      result = await WorkspaceAPIClient.get(companyId, workspaceId);
    } catch (err) {
      logger.error('Can not get workspace in WorkspaceGetOrFetch', err);
    }

    if (result) {
      setWorkspaces((previous) => [...previous, result!]);
    }

    return result;
  }
});

export const fetchCompanyWorkspaces = selectorFamily<WorkspaceType[], string>({
  key: 'fetchCompanyWorkspaces',
  get: (companyId) => async ({ get }) => {
    logger.debug("fetchCompanyWorkspaces", companyId);
    return await WorkspaceAPIClient.list(companyId) || [];
  }
});

export const getWorkspacesForCompany = selectorFamily<WorkspaceType[], string>({
  key: 'getWorkspacesForCompany',
  get: (companyId) => ({ get }) => {
    return get(WorkspaceListStateFamily(companyId)).filter(ws => ws.company_id === companyId);
  }
});

