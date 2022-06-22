import { delayRequest } from 'app/features/global/utils/managedSearchRequest';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { SearchInputState } from '../state/search-input';
import { LoadingState } from 'app/features/global/state/atoms/Loading';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import { SearchMessagesResultsState } from '../state/search-messages-result';
import messageApiClient from 'app/features/messages/api/message-api-client';
import { MessageExtended } from 'app/features/messages/types/message';

const useSearchMessages = () => {
  const companyId = useRouterCompany();
  const searchInput = useRecoilValue(SearchInputState);
  const [loading, setLoading] = useRecoilState(LoadingState('useSearchMessages'));

  const [searched, setSearched] = useRecoilState(SearchMessagesResultsState);

  const opt = { limit: 100, company_id: companyId };

  const refresh = async () => {
    setLoading(true);

    let results: MessageExtended[] = [];

    if (searchInput.query) {
      const response = await messageApiClient.search(searchInput.query, opt);
      results = response.resources;
    }

    setSearched({
      results,
      nextPage: null,
    });
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
        delayRequest('useSearchMessages', async () => {
          refresh();
        });
      } else {
        refresh();
      }
    })();
  }, [searchInput.query]);

  return { loading, messages: searched, loadMore, refresh };
};
