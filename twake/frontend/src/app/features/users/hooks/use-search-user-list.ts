import { useEffect, useState } from 'react';

import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { UserType } from 'app/features/users/types/user';
import { getCurrentUserList, setUserList, useSetUserList, useUserList } from './use-user-list';
import UserAPIClient, { SearchContextType } from '../api/user-api-client';
import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import Strings from 'app/features/global/utils/strings';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import _ from 'lodash';

export const searchBackend = async (
  query: string | undefined,
  {
    workspaceId,
    companyId,
    scope,
    callback,
  }: {
    workspaceId: string;
    companyId: string;
    scope: SearchContextType['scope'];
    callback?: () => void;
  },
) => {
  delayRequest('useSearchUserList', async () => {
    await UserAPIClient.search<any>(
      query,
      {
        companyId,
        workspaceId: scope === 'workspace' ? workspaceId : undefined,
        scope,
      },
      result => {
        let final: UserType[] = [];
        if (result && scope === 'workspace') {
          final = result.map(wsUser => ({
            ...wsUser.user,
            workspaces: [{ id: workspaceId, company_id: companyId }],
          }));
        }

        if (result && scope === 'company') {
          final = result.map(user => ({
            ...user,
            workspaces: [{ id: workspaceId, company_id: companyId }],
          }));
        }

        callback && callback();
        setUserList && setUserList(final);
      },
    );
  });
};

export const searchFrontend = (
  query: string | undefined,
  {
    workspaceId,
    companyId,
    scope,
    userList,
  }: {
    workspaceId: string;
    companyId: string;
    scope: SearchContextType['scope'];
    userList?: UserType[];
  },
) => {
  let result = userList || getCurrentUserList() || [];

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

  if (!query) {
    // TODO return list with users sorted by favorite
    // eslint-disable-next-line no-self-assign
    result = result;
  }

  if (scope === 'company') {
    result = result?.filter(u => u.companies?.map(obj => obj.company.id).includes(companyId));
  }

  if (scope === 'workspace') {
    result = result.filter(u => u.workspaces?.map(ws => ws.id).includes(workspaceId));
  }

  return result;
};

export const useSearchUserList = ({
  scope,
}: {
  scope: SearchContextType['scope'];
}): {
  search: (str?: string) => UserType[];
  result: UserType[];
} => {
  const { set: setUserList } = useSetUserList('use-search-user-list');
  const [query, setQuery] = useState<string | undefined>();
  let { userList } = useUserList();
  userList = _.uniqBy(userList, 'id');

  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const search = (str?: string) => {
    setQuery(str);
    return searchFrontend(str, { workspaceId, scope, companyId, userList: userList || [] });
  };

  useEffect(() => {
    searchBackend(query, { workspaceId, scope, companyId });
  }, [companyId, query, scope, setUserList, workspaceId]);

  const result = searchFrontend(query, { workspaceId, scope, companyId, userList: userList || [] });

  return { search, result };
};
