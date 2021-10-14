import { useRecoilCallback, useRecoilState } from "recoil";

import { WorkspaceType } from "app/models/Workspace";
import { WorkspaceGetOrFetch, WorkspaceListStateFamily } from "../atoms/WorkspaceList";

export const useCompanyWorkspaces = (companyId: string = ''): [
  WorkspaceType[],
  (workpace: WorkspaceType) => void,
  (workspaceId: string) => Promise<WorkspaceType | undefined>
] => {
  // TODO: Add realtime with websockets
  const [workspaces, setWorkspaces] = useRecoilState(WorkspaceListStateFamily(companyId));
  const get = useRecoilCallback(({ snapshot }) => async (workspaceId: string) => {
    return await snapshot.getPromise(WorkspaceGetOrFetch({ companyId, workspaceId }));
  }, [companyId]);

  const add = (workspace: WorkspaceType) => {
    // TODO: Create the workspace on the backend
    const index = workspaces.findIndex(ws => ws.id === workspace.id);

    if (index === -1) {
      setWorkspaces((workspaces) => [...workspaces, workspace]);
    } else {
      setWorkspaces((workspaces) => [...workspaces.slice(0, index), workspace, ...workspaces.slice(index + 1)]);
    }
  };

  return [
    workspaces,
    add,
    get,
  ];
};
