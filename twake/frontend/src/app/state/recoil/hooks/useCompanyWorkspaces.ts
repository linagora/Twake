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
import AccessRightsService, { RightsOrNone } from 'app/services/AccessRightsService';
import LocalStorage from 'app/services/LocalStorage';
import useRouterCompany from './useRouterCompany';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';

type WorkspacesResources = RealtimeResources<WorkspaceType>;

const logger = Logger.getLogger('useCompanyWorkspaces');

export const useCompanyWorkspaces = (companyId: string = '') => {
  const [workspaces, setWorkspaces] = useRecoilState(WorkspaceListStateFamily(companyId));

  const routerWorkspaceId = useRouterWorkspace();
  const bestCandidate = useBestCandidateWorkspace(companyId, workspaces);

  //Fixme get this from backend
  const roomName = `/companies/${companyId}/workspaces`;

  const refresh = async () => {
    setWorkspaces(await WorkspaceAPIClient.list(companyId));
  };

  useRealtimeRoom<WorkspaceType>(roomName, 'useCompanyWorkspaces', (action, resource) => {
    if (action === 'saved') {
      refresh();
    } else {
      // not supported for now
    }
  });

  if (!routerWorkspaceId && bestCandidate) {
    RouterService.push(
      RouterService.generateRouteFromState({
        workspaceId: bestCandidate.id,
      }),
    );
  }

  //Retro compatibility
  workspaces.forEach(w => {
    Collections.get('workspaces').updateObject(_.cloneDeep(w));
    AccessRightsService.updateLevel(w.id, w.role as RightsOrNone);
  });

  //If there is no company for this user, display the no company page
  if (workspaces.length === 0) {
    WorkspacesService.openNoWorkspacesPage();
  }

  return { workspaces, refresh };
};

export function useCurrentWorkspace() {
  const companyId = useRouterCompany();
  const routerWorkspaceId = useRouterWorkspace();
  const { workspaces, refresh } = useCompanyWorkspaces(companyId);
  return { workspace: workspaces.find(w => w.id == routerWorkspaceId), refresh };
}

/**
 * Workspace priority:
 * 1. Router workspace id
 * 2. Local storage workspace id
 * 3. User's workspace with the most total members
 *
 * @param userWorkspaces
 * @returns WorkspaceType | undefined
 */
export function useBestCandidateWorkspace(
  companyId: string,
  userWorkspaces: WorkspaceType[],
): WorkspaceType | undefined {
  const routerWorkspaceId = useRouterWorkspace();
  const storageWorkspaceId =
    (LocalStorage.getItem('default_workspace_id_' + companyId) as string) || null;

  return (
    userWorkspaces?.find(w => w.id === routerWorkspaceId) ||
    userWorkspaces?.find(w => w.id === storageWorkspaceId) ||
    userWorkspaces?.sort((a, b) => a?.stats?.total_members - b.stats?.total_members)[0] ||
    userWorkspaces[0]
  );
}
