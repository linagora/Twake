import { atom, AtomEffect } from "recoil";

import { WorkspaceType } from "app/models/Workspace";
import UserContextState from "../../UserContextState";

const currentWorkspaceEffect: AtomEffect<WorkspaceType| undefined> = ({ onSet }) => {
  onSet(workspace => UserContextState.workspace = workspace);
};

export const CurrentWorkspaceState = atom<WorkspaceType | undefined>({
  key: 'CurrentWorkspaceState',
  default: undefined,
  effects_UNSTABLE: [
    currentWorkspaceEffect,
  ],
});
