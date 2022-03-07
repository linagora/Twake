import { useEffect, useState } from 'react';

import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { UserType } from 'app/features/users/types/user';
import { useSetUserList, useUserList } from './use-user-list';
import UserAPIClient, { SearchContextType } from '../api/user-api-client';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import Strings from 'app/features/global/utils/strings';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { WorkspaceUserType } from 'app/features/workspaces/types/workspace';

export const useSearchUserList = ({
  scope,
}: {
  scope: SearchContextType['scope'];
}): {
  search: (str?: string) => void;
  result: UserType[];
} => {
  const { set: setUserList } = useSetUserList('use-search-user-list');
  const [query, setQuery] = useState<string | undefined>();
  const { userList } = useUserList();
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  let result = userList || [];
  const search = async (str?: string) => {
    setQuery(str);
  };

  useEffect(() => {
    delayRequest('useSearchUserList', async () => {
      await UserAPIClient.search<WorkspaceUserType>(
        query,
        {
          companyId,
          workspaceId: scope === 'workspace' ? workspaceId : undefined,
          scope,
        },
        list => {
          if (list && scope === 'workspace') {
            setUserList(
              list.map(wsUser => ({
                ...wsUser.user,
                workspaces: [{ id: workspaceId, company_id: companyId }],
              })),
            );
          }
        },
      );
    });
  }, [companyId, query, scope, setUserList, workspaceId]);

  if (query) {
    result = result
      .filter(
        ({ email, first_name, last_name, username }) =>
          Strings.removeAccents(`${email} ${first_name} ${last_name} ${username}`)
            .toLocaleLowerCase()
            .indexOf(Strings.removeAccents(query).toLocaleLowerCase()) > -1,
      )
      .sort((a, b) => a.username.length - b.username.length);
  }

  if (scope === 'company') {
    result = result?.filter(u => u.companies?.map(obj => obj.company.id).includes(companyId));
  }

  if (scope === 'workspace') {
    result = result.filter(u => u.workspaces?.map(ws => ws.id).includes(workspaceId));
  }

  return { search, result };
};
