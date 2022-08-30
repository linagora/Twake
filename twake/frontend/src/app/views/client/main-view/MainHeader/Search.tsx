import RouterServices from 'app/features/router/services/router-service';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import Languages from 'app/features/global/services/languages-service';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { Button } from '@atoms/button/button';
import { SearchIcon } from '@heroicons/react/solid';
import { Input } from '@atoms/input/input-text';
import { InputDecorationIcon } from 'app/atoms/input/input-decoration-icon';
import { useRecoilState } from 'recoil';
import { SearchInputState } from 'app/features/search/state/search-input';

export default (): JSX.Element => {
  const { workspaceId, companyId, channelId } = RouterServices.getStateFromRoute();
  const { setOpen: setOpenSearch } = useSearchModal();
  const [searchState, setSearchState] = useRecoilState(SearchInputState);

  const setOpen = () => {
    if (
      searchState.query === '' ||
      (searchState.channelId && searchState.channelId !== channelId)
    ) {
      setSearchState({ query: searchState.query, workspaceId: workspaceId, channelId: channelId });
    }
    setOpenSearch(true);
  };

  const disable = !(
    AccessRightsService.hasLevel(workspaceId, 'member') &&
    AccessRightsService.getCompanyLevel(companyId) !== 'guest'
  );

  return (
    <>
      <div className="hidden sm:block w-48">
        {!disable && (
          <InputDecorationIcon
            prefix={SearchIcon}
            input={({ className }) => (
              <Input
                value={searchState.query}
                className={className + ' text-zinc-500'}
                maxLength={0}
                readOnly
                placeholder={Languages.t('scenes.client.main_view.main_header.search_input')}
                onClick={() => setOpen()}
              />
            )}
          />
        )}
      </div>

      <div className="sm:hidden">
        {!disable && (
          <Button
            theme="outline"
            size="sm"
            className="rounded-full"
            icon={SearchIcon}
            onClick={() => setOpen()}
          />
        )}
      </div>
    </>
  );
};
