import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { CompanyType } from 'app/models/Company';
import { CompaniesState } from '../atoms/Companies';
import { CurrentUserState } from '../atoms/CurrentUser';
import { CurrentWorkspaceState } from '../atoms/CurrentWorkspace';
import LoginService from 'app/services/login/LoginService';
import WorkspaceService from 'app/services/workspaces/workspaces';
import CurrentUserService from 'app/services/user/CurrentUser';
import UserAPIClient from 'services/user/UserAPIClient';
import Groups from 'app/services/workspaces/groups';
import useRouterCompany from '../hooks/useRouterCompany';

export const useTwakeContext = () => {
  const [user, setUser] = useRecoilState(CurrentUserState);
  const [workspace, setWorkspace] = useRecoilState(CurrentWorkspaceState);

  useEffect(() => {
    const listener = LoginService.addListener((data: { login: { currentUserId: string } }) => {
      if (data.login.currentUserId && CurrentUserService.get()) {
        setUser({ ...CurrentUserService.get() });
      }
    });

    return () => LoginService.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = WorkspaceService.addListener(
      (data: { workspaces: { currentWorkspaceId: string } }) => {
        if (data.workspaces.currentWorkspaceId && WorkspaceService.getCurrentWorkspace()) {
          setWorkspace({ ...WorkspaceService.getCurrentWorkspace() });
        }
      },
    );

    return () => WorkspaceService.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyId = useRouterCompany();

  useEffect(() => {
    Groups.select({ id: companyId });
  }, [companyId]);

  return {
    user,
    workspace,
  };
};
