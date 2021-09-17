import { atom, AtomEffect } from "recoil";

import { WorkspaceType } from "app/models/Workspace";

type WorkspaceList = WorkspaceType[];

const workspacesEffect: AtomEffect<WorkspaceList> = ({ onSet }): void => {
  onSet(workspaces => {
    console.log("SET", workspaces);
  });
};

export const WorkspaceListState = atom<WorkspaceList>({
  key: 'WorkspaceListState',
  default: [],
  effects_UNSTABLE: [
    workspacesEffect,
  ]
});
