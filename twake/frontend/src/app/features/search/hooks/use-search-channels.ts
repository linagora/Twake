import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { SearchInputState } from '../state/search-input';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import {
  SearchChannelsResultsState,
  SearchUsersChannelsResultsState,
} from '../state/search-channels-result';
import { RecentChannelsState } from '../state/recent-channels';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { searchBackend, useSearchUsers } from 'app/features/users/hooks/use-search-user-list';
import { createDirectChannelFromUsers } from 'app/features/channels/types/channel';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { useGlobalEffect } from 'app/features/global/hooks/use-global-effect';
import _ from 'lodash';
import UserAPIClient from 'app/features/users/api/user-api-client';

export const useSearchChannelsLoading = () => {
  return useRecoilValue(LoadingState('useSearchChannels'));
};

let currentQuery = '';

export const useSearchChannels = () => {
  const companyId = useRouterCompany();
  const { user: currentUser } = useCurrentUser();

  const searchInput = useRecoilValue(SearchInputState);
  const [loading, setLoading] = useRecoilState(LoadingState('useSearchChannels'));

  const [searched, setSearched] = useRecoilState(SearchChannelsResultsState(companyId));
  const [recent, setRecent] = useRecoilState(RecentChannelsState(companyId));

  const opt = { limit: 100, company_id: companyId };

  const refresh = async () => {
    setLoading(true);
    const isRecent = !searchInput.query;

    const query = searchInput.query;
    currentQuery = query;

    const response = await ChannelAPIClient.search(searchInput.query || null, opt);
    let results = (response.resources || []).sort(
      (a, b) =>
        (b.last_activity || 0) / 100 +
        (b.user_member?.last_access || 0) -
        ((a.last_activity || 0) / 100 + (a.user_member?.last_access || 0)),
    );

    if (!isRecent) {
      const users = await UserAPIClient.search<any>(searchInput.query, {
        scope: 'company',
        companyId,
      });
      results = [
        ...results,
        ...(users || []).map(user => createDirectChannelFromUsers(companyId, [currentUser, user])),
      ];
    }

    const update = {
      results,
      nextPage: null,
    };

    if (currentQuery !== query) {
      return;
    }

    if (!isRecent) setSearched(update);
    if (isRecent) setRecent(update);
    setLoading(false);
  };

  const loadMore = async () => {
    //Not implemented
    console.error('Not implemented');
  };

  useGlobalEffect(
    'useSearchChannels',
    () => {
      (async () => {
        setLoading(true);
        if (searchInput) {
          delayRequest('useSearchChannels', async () => {
            await refresh();
          });
        } else {
          refresh();
        }
      })();
    },
    [searchInput.query],
  );

  return {
    loading,
    channels: searchInput?.query ? searched.results : recent.results,
    loadMore,
    refresh,
  };
};
