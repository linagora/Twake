import { useRecoilCallback, useRecoilState } from 'recoil';

import { WorkspaceType } from 'app/models/Workspace';
import { WorkspaceGetOrFetch, WorkspaceListStateFamily } from '../atoms/WorkspaceList';
import Collections from 'app/services/Depreciated/Collections/Collections';
import Logger from 'app/services/Logger';
import { useGetHTTP } from 'app/services/hooks/useHTTP';
import { Maybe } from 'app/types';
import { RealtimeResources } from 'app/services/Realtime/types';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import useRouterWorkspace from './useRouterWorkspace';
import RouterService from 'app/services/RouterService';
import _ from 'lodash';
import WorkspacesService from 'services/workspaces/workspaces.js';

type WorkspacesResources = RealtimeResources<WorkspaceType>;

const logger = Logger.getLogger('useCompanyWorkspaces');

const useFetchWorkspaces = (companyId: string) => {
  return useGetHTTP<WorkspacesResources>(`workspaces/v1/companies/${companyId}/workspaces`);
};

export const useCompanyWorkspaces = (
  companyId: string = '',
): [
  WorkspaceType[],
  (workpace: WorkspaceType) => void,
  (workspaceId: string) => Promise<Maybe<WorkspaceType>>,
] => {
  // TODO: can be used in recoil
  const [workspace] = useFetchWorkspaces(companyId);
  const routerWorkspaceId = useRouterWorkspace();
  const roomName = workspace?.websockets?.[0]?.room || '';

  const [workspaces, updateWorkspaces] = useRecoilState(WorkspaceListStateFamily(companyId));
  const get = useRecoilCallback(
    ({ snapshot }) =>
      async (workspaceId: string) => {
        return await snapshot.getPromise(WorkspaceGetOrFetch({ companyId, workspaceId }));
      },
    [companyId],
  );

  const addOrUpdate = (workspace: WorkspaceType): void => {
    const index = workspaces.findIndex(ws => ws.id === workspace.id);

    if (index === -1) {
      logger.debug('Add workspace', workspace);
      updateWorkspaces(workspaces => [...workspaces, workspace]);
    } else {
      logger.debug('Update workspace', workspace);
      updateWorkspaces(workspaces => [
        ...workspaces.slice(0, index),
        workspace,
        ...workspaces.slice(index + 1),
      ]);
    }

    // TODO: To be deleted when workspaces collections are not used anymore
    Collections.get('workspaces').updateObject(
      _.cloneDeep({
        id: workspace.id,
        name: workspace.name,
      }),
    );
  };

  useRealtimeRoom<WorkspaceType>(roomName, 'useCompanyWorkspaces', (action, resource) => {
    if (action === 'saved') {
      addOrUpdate(resource);
    } else {
      // not supported for now
    }
  });

  if (!routerWorkspaceId && workspaces?.[0]?.id) {
    RouterService.push(
      RouterService.generateRouteFromState({
        workspaceId: workspaces?.[0]?.id,
      }),
    );
  }

  //If there is no company for this user, display the no company page
  if (workspaces.length === 0) {
    WorkspacesService.openNoWorkspacesPage();
  }

  return [workspaces, addOrUpdate, get];
};
