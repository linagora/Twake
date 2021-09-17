import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { CompanyListState } from 'app/state/recoil/atoms/CompanyList';
import { useCurrentUser } from 'app/state/recoil/atoms/CurrentUser';
import WorkspaceAPIClient from './WorkspaceAPIClient';
import { WorkspaceListState } from 'app/state/recoil/atoms/WorkspaceList';
import Logger from 'services/Logger';

const logger = Logger.getLogger('useWorkspace');

export const useWorkspace = () => {
  const user = useCurrentUser();
  const [companies, setCompanies] = useRecoilState(CompanyListState);
  const [workspaces, setWorkspaces] = useRecoilState(WorkspaceListState);

  useEffect(() => {
    if (user) {
      getCompaniesAndWorkspaces();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function getCompaniesAndWorkspaces(): void {
    if (!user) {
      return;
    }

    WorkspaceAPIClient.listCompanies(user.id)
      .then(companies => {
        setCompanies(companies);
        return companies;
      })
      .then(companies => Promise.all((companies || []).map(company => WorkspaceAPIClient.list(company.id))))
      .then(workspaces => workspaces.flat())
      .then(workspaces => setWorkspaces(workspaces))
      .catch(err => {
        logger.error('Error while getting workspaces and companies...', err);
      });
  }

  return {
    companies,
    workspaces,
  };
};
