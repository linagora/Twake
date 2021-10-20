import { useEffect } from "react";
import { useRecoilState } from "recoil";

import { CompanyType } from "app/models/Company";
import { CurrentCompanyState } from "../atoms/CurrentCompany";
import { CurrentUserState } from "../atoms/CurrentUser";
import { CurrentWorkspaceState } from "../atoms/CurrentWorkspace";
import LoginService from "app/services/login/LoginService";
import WorkspaceService from "app/services/workspaces/workspaces";
import CurrentUserService from "app/services/user/CurrentUser";
import UserAPIClient from "services/user/UserAPIClient";

export const useTwakeContext = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);
  const [workspace, setWorkspace] = useRecoilState(CurrentWorkspaceState);
  const [company, setCompany] = useRecoilState(CurrentCompanyState);

  useEffect(() => {
    const listener = LoginService.addListener((data: {login: {currentUserId: string}}) => {
      if (data.login.currentUserId && CurrentUserService.get()) {
        setUser({...CurrentUserService.get()});
      }
    });

    return () => LoginService.removeListener(listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = WorkspaceService.addListener((data: {workspaces: {currentWorkspaceId: string}}) => {
      if (data.workspaces.currentWorkspaceId && WorkspaceService.getCurrentWorkspace()) {
        setWorkspace({...WorkspaceService.getCurrentWorkspace()});
      }
    });

    return () => WorkspaceService.removeListener(listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = WorkspaceService.addListener((data: {workspaces: {currentGroupId: string}}) => {
      if (data.workspaces.currentGroupId) {
        UserAPIClient.getCompany(data.workspaces.currentGroupId).then(company=>{
          setCompany(company as CompanyType);
        });
      }
    });

    return () => WorkspaceService.removeListener(listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    workspace,
    company,
  };
};
