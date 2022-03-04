import { useEffect } from 'react';
import { clone, cloneDeep, concat, isEqual } from 'lodash';
import { RecoilState, useRecoilCallback, useRecoilValueLoadable } from 'recoil';

import useRouterCompany from 'app/features/router/hooks/use-router-company';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { UserCompanyType, UserType } from 'app/features/users/types/user';
import WorkspaceUserAPIClient from 'app/features/workspace-members/api/workspace-members-api-client';
import { UserListState } from '../state/atoms/user-list';
import Logger from 'app/features/global/framework/logger-service';

/**
 *
 * Refactor User recoil hooks:
 * Enlever les setUserList des react components;
 * enlerver setUserList du status component
 *
 * // Recupérer les users
 * . La liste des messages
 * . La liste des membres dans l'objet channel (direct)
 * . la liste des workspace-members
 * . La liste des channel-members
 * . La liste des channel-guests
 *
 * . Completer les users avec l'object companies
 *
 * 
 * Dans la route workspaces members ajouter option include_companies coté back GET list
 * 
  // Move me and refactor
 * 
 * // La recherche user
 * Hook pour la recherche User basé sur le UserApiClient
 * Optimiser le resultat des recherches entre le backend et le frontend
 *
 */

export const useUserList = (): {
  userList?: UserType[];
} => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterWorkspace();
  const { set: setUserList } = useSetUserList('useUserList');
  const userList = useRecoilValueLoadable(UserListState).valueMaybe();

  const preloadSomeUsers = async () => {
    const updatedData = (await WorkspaceUserAPIClient.list(companyId, workspaceId)).map(
      wsUser => wsUser.user,
    );

    if (updatedData) setUserList(updatedData);
  };

  useEffect(() => {
    if (companyId.length && workspaceId.length) preloadSomeUsers();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, workspaceId]);

  return { userList };
};

// Access from any services
// You can't use it before calling the useSetUserList hook
export let setUserList: (
  recoilVal: RecoilState<UserType[]>,
  valOrUpdater: UserType[] | ((currVal: UserType[]) => UserType[]),
) => void = _u => {};

let currentUserList: UserType[] = [];

export const getUser = (userId: string) => {
  return currentUserList.filter(u => u.id === userId)[0];
};

const completeUserWithCompanies = (user: UserType, companies?: UserCompanyType[]): UserType => ({
  ...user,
  companies: companies !== undefined ? companies : user.companies || [],
});

// Access from hooks-components
export function useSetUserList(key: string) {
  const logger = Logger.getLogger(`[${key}]`);

  const set = useRecoilCallback(({ set }) => (nextList: UserType[]) => {
    const currentList = currentUserList;

    if (nextList && nextList.length) {
      const newList = concat(
        currentList.filter(u => !nextList.map(u => u.id).includes(u.id)),
        nextList,
      )
        .map(u => cloneDeep(u))
        .map(u =>
          completeUserWithCompanies(u, currentList.find(obj => obj.id === u.id)?.companies),
        );

      newList.sort();

      if (currentList && newList && !isEqual(currentList, newList)) {
        logger.debug(`UserListState is updated to`, cloneDeep(currentList), newList);
        set(UserListState, newList);
        currentUserList = newList;
      }
    }

    setUserList = set;
  });

  return { set };
}
