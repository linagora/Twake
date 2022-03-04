import { useEffect, useState } from 'react';

import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { UserType } from 'app/features/users/types/user';
import { useUserList } from './use-user-list';
import UserAPIClient, { SearchContextType } from '../api/user-api-client';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import Strings from 'app/features/global/utils/strings';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { WorkspaceUserType } from 'app/features/workspaces/types/workspace';
import { useWorkspace } from 'app/features/workspaces/hooks/use-workspaces';

export const useSearchUserList = ({
  scope,
}: {
  scope: SearchContextType['scope'];
}): {
  search: (str?: string) => void;
  result: UserType[];
} => {
  const [query, setQuery] = useState<string | undefined>();
  const { userList } = useUserList();
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const [searched, setSearched] = useState<(UserType | WorkspaceUserType)[]>([]);
  let result = userList || [];
  const search = async (str?: string) => {
    setQuery(str);
  };

  useEffect(() => {
    delayRequest('useSearchUserList', async () => {
      setSearched(
        await UserAPIClient.search<UserType>(query, {
          companyId,
          workspaceId: scope === 'workspace' ? workspaceId : undefined,
          scope,
        }),
      );
    });
  }, [companyId, query, scope, workspaceId]);

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
    const wsSearched = searched as WorkspaceUserType[];
    result = result.filter(u => wsSearched.map(wsUser => wsUser.user_id).includes(u.id || ''));
  }

  return { search, result };
};
