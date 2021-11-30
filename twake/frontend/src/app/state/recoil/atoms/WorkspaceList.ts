import { atomFamily, selectorFamily, useSetRecoilState } from 'recoil';

import { WorkspaceType } from 'app/models/Workspace';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';
import Logger from 'app/services/Logger';
import _ from 'lodash';
import Collections from 'app/services/Depreciated/Collections/Collections';

const logger = Logger.getLogger('WorkspaceListState');

export const WorkspaceListStateFamily = atomFamily<WorkspaceType[], string>({
  key: 'WorkspaceListStateFamily',
  default: () => [],

  //Depreciated
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet(workspaces =>
        workspaces.map(w => {
          Collections.get('workspaces').updateObject(_.cloneDeep(w));
        }),
      );
    },
  ],
});

export const WorkspaceGetOrFetch = selectorFamily<
  WorkspaceType | undefined,
  { companyId: string; workspaceId: string }
>({
  key: 'WorkspaceGet',
  get:
    ({ companyId, workspaceId }) =>
    async ({ get }) => {
      // FIXME: This fails because we use hook out of hook context
      const setWorkspaces = useSetRecoilState(WorkspaceListStateFamily(companyId));
      let result = get(WorkspaceListStateFamily(companyId)).find(
        ws => ws.id === workspaceId && ws.company_id === companyId,
      );

      if (result) {
        return result;
      }

      try {
        result = await WorkspaceAPIClient.get(companyId, workspaceId);
      } catch (err) {
        logger.error('Can not get workspace in WorkspaceGetOrFetch', err);
      }

      if (result) {
        setWorkspaces(previous => [...previous, result!]);
      }

      return result;
    },
});

export const getWorkspacesForCompany = selectorFamily<WorkspaceType[], string>({
  key: 'getWorkspacesForCompany',
  get:
    companyId =>
    ({ get }) => {
      logger.debug('getWorkspacesForCompany', companyId);

      return get(WorkspaceListStateFamily(companyId)).filter(ws => ws.company_id === companyId);
    },
});

export const getWorkspaceInCompany = selectorFamily<
  WorkspaceType | undefined,
  { companyId: string; workspaceId: string }
>({
  key: 'getWorkspaceInCompany',
  get:
    ({ companyId, workspaceId }) =>
    ({ get }) => {
      logger.debug('getWorkspaceInCompany', companyId, workspaceId);
      const workspaces = get(getWorkspacesForCompany(companyId));

      return (workspaces || []).find(ws => ws.id === workspaceId);
    },
});
