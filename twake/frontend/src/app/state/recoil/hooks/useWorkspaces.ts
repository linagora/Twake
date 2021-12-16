import { useRecoilState, useRecoilValue } from 'recoil';

import { WorkspaceType } from 'app/models/Workspace';
import { WorkspaceListStateFamily } from '../atoms/WorkspaceList';
import Collections from 'app/services/Depreciated/Collections/Collections';
import Logger from 'app/services/Logger';
import { useRealtimeRoom } from 'app/services/Realtime/useRealtime';
import useRouterWorkspace from './router/useRouterWorkspace';
import RouterService from 'app/services/RouterService';
import _ from 'lodash';
import WorkspacesService from 'services/workspaces/workspaces.js';
import AccessRightsService, { RightsOrNone } from 'app/services/AccessRightsService';
import LocalStorage from 'app/services/LocalStorage';
import useRouterCompany from './router/useRouterCompany';
import WorkspaceAPIClient from 'app/services/workspaces/WorkspaceAPIClient';
import Workspaces from 'services/workspaces/workspaces.js';
import { LoadingState } from '../atoms/Loading';

const logger = Logger.getLogger('useWorkspaces');

export const useWorkspaces = (companyId: string = '') => {
  const [workspaces, setWorkspaces] = useRecoilState(WorkspaceListStateFamily(companyId));
  const [loading, setLoading] = useRecoilState(LoadingState(`workspaces-${companyId}`));

  const routerWorkspaceId = useRouterWorkspace();
  const bestCandidate = useBestCandidateWorkspace(companyId, workspaces);

  const refresh = async () => {
    if (workspaces.length === 0) {
      setLoading(true);
    }
    const updated = await WorkspaceAPIClient.list(companyId);
    setWorkspaces(updated);
    if (updated.length === 0) WorkspacesService.openNoWorkspacesPage();
    setLoading(false);
  };

  //Fixme: use the token got from backend here
  const { send } = useRealtimeRoom<WorkspaceType>(
    WorkspaceAPIClient.websockets(companyId)[0],
    'useWorkspaces',
    (action, resource) => {
      if (action === 'saved') {
        refresh();
      } else {
        // not supported for now
      }
    },
  );

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
  //End

  return { workspaces, loading, refresh };
};

export function useWorkspaceLoader(companyId: string) {
  const loading = useRecoilValue(LoadingState(`workspaces-${companyId}`));
  return { loading };
}

export function useCurrentWorkspace() {
  const companyId = useRouterCompany();
  const routerWorkspaceId = useRouterWorkspace();
  const { workspaces, refresh } = useWorkspaces(companyId);
  const workspace = workspaces.find(w => w.id == routerWorkspaceId);

  //Retro compatibility
  Workspaces.updateCurrentWorkspaceId(workspace?.id || '');
  Workspaces.updateCurrentCompanyId(workspace?.company_id || '');
  //End

  return { workspace, refresh };
}

export function useWorkspace(workspaceId: string) {
  const companyId = useRouterCompany();
  const { workspaces, refresh } = useWorkspaces(companyId);
  const workspace = workspaces.find(w => w.id == workspaceId);
  return { workspace, refresh };
}

/**
 * Workspace priority:
 * 1. Router workspace id
 * 2. Local storage workspace id
 * 3. User's workspace with the most total members
 *
 * @param workspaces
 * @returns WorkspaceType | undefined
 */
export function useBestCandidateWorkspace(
  companyId: string,
  workspaces: WorkspaceType[],
): WorkspaceType | undefined {
  const routerWorkspaceId = useRouterWorkspace();
  const storageWorkspaceId =
    (LocalStorage.getItem('default_workspace_id_' + companyId) as string) || null;

  return (
    workspaces?.find(w => w.id === routerWorkspaceId) ||
    workspaces?.find(w => w.id === storageWorkspaceId) ||
    _.cloneDeep(workspaces)?.sort((a, b) => a?.stats?.total_members - b.stats?.total_members)[0] ||
    workspaces[0]
  );
}
