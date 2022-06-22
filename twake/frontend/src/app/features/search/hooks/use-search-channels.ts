import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { SearchInputState } from '../state/search-input';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import { SearchChannelsResultsState } from '../state/search-channels-result';
import { RecentChannelsState } from '../state/recent-channels';
import ChannelAPIClient from 'app/features/channels/api/channel-api-client';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { useSearchUserList } from 'app/features/users/hooks/use-search-user-list';
import { createDirectChannelFromUsers } from 'app/features/channels/types/channel';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { UserType } from 'app/features/users/types/user';

const useSearchChannels = () => {
  const companyId = useRouterCompany();
  const { user: currentUser } = useCurrentUser();

  const { search, result: users } = useSearchUserList({ scope: 'company' });

  const searchInput = useRecoilValue(SearchInputState);
  const [loading, setLoading] = useRecoilState(LoadingState('useSearchChannels'));

  const [_searched, setSearched] = useRecoilState(SearchChannelsResultsState);
  const [recent, setRecent] = useRecoilState(RecentChannelsState);

  const opt = { limit: 100, company_id: companyId };

  const refresh = async () => {
    setLoading(true);
    const isRecent = !searchInput.query;

    if (!isRecent) search(searchInput.query);

    const response = await ChannelAPIClient.search(searchInput.query || null, opt);
    const results = (response.resources || []).sort(
      (a, b) =>
        (b.last_activity || 0) / 100 +
        (b.user_member?.last_access || 0) -
        ((a.last_activity || 0) / 100 + (a.user_member?.last_access || 0)),
    );

    const update = {
      results,
      nextPage: null,
    };

    if (!isRecent) setSearched(update);
    if (isRecent) setRecent(update);
    setLoading(false);
  };

  const loadMore = async () => {
    //Not implemented
    console.error('Not implemented');
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (searchInput) {
        delayRequest('useSearchChannels', async () => {
          refresh();
        });
      } else {
        refresh();
      }
    })();
  }, [searchInput.query]);

  //We have two simultaneous results: users and searched
  let searched = _searched.results;
  if (searchInput?.query) {
    searched = [
      ..._searched.results,
      ...users.map(u => createDirectChannelFromUsers(companyId, [currentUser as UserType, u])),
    ];
  }

  return {
    loading,
    channels: searchInput?.query ? searched : recent.results,
    loadMore,
    refresh,
  };
};
