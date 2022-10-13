import {
  BellIcon,
  ChevronDownIcon,
  CogIcon,
  SearchIcon,
  ViewGridIcon,
} from '@heroicons/react/outline';
import Avatar from 'app/atoms/avatar';
import { CheckIcon } from 'app/atoms/icons-agnostic';
import { InputDecorationIcon } from 'app/atoms/input/input-decoration-icon';
import { Input } from 'app/atoms/input/input-text';
import A from 'app/atoms/link';
import { Base, Info, Subtitle, Title } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import menusManager from 'app/components/menus/menus-manager';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';
import Languages from 'app/features/global/services/languages-service';
import useRouterChannel from 'app/features/router/hooks/use-router-channel';
import useRouterWorkspace from 'app/features/router/hooks/use-router-workspace';
import { useSearchModal } from 'app/features/search/hooks/use-search';
import { SearchInputState } from 'app/features/search/state/search-input';
import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import Block from 'app/molecules/grouped-rows/base';
import { useRecoilState } from 'recoil';
import PopupService from 'app/deprecated/popupManager/popupManager.js';
import RouterService from 'app/features/router/services/router-service';

export const MainHeader = () => {
  const { company } = useCurrentCompany();
  const { user } = useCurrentUser();

  return (
    <div className="flex flex-row items-center px-4 py-3">
      <div className="grow max-w-xs flex items-center" style={{ minWidth: 80 }}>
        <Menu
          options={{ menuClassName: '!w-80' }}
          menu={
            <div className="-mb-2">
              <Title>Companies</Title>
              <Info>Your active companies</Info>
              <hr className="-mx-4 mt-3 mb-2" />
              {user?.companies?.map(c => (
                <Block
                  onClick={() => {
                    PopupService.closeAll();
                    menusManager.closeMenu();
                    RouterService.push(
                      RouterService.generateRouteFromState(
                        {
                          companyId: c.company.id,
                        },
                        { replace: true },
                      ),
                    );
                  }}
                  key={c.company.id}
                  className="w-auto flex cursor-pointer -mx-2 p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-md"
                  avatar={
                    <Avatar
                      className="border border-solid border-zinc-200"
                      avatar={c.company?.logo}
                      title={c.company?.name}
                    />
                  }
                  title={<span className="sm:inline hidden">{c?.company?.name}</span>}
                  suffix={
                    (c.company.id === company.id && (
                      <div className="text-blue-500">
                        <CheckIcon fill="currentColor" />
                      </div>
                    )) || <></>
                  }
                />
              ))}
            </div>
          }
          position="bottom"
          className="inline-flex cursor-pointer"
        >
          <Block
            className="inline-flex cursor-pointer"
            avatar={
              <Avatar
                className="border border-solid border-zinc-200"
                avatar={company?.logo}
                title={company?.name}
              />
            }
            title={<span className="sm:inline hidden">{company?.name}</span>}
            title_suffix={
              <ChevronDownIcon className="h-4 w-4 sm:ml-1 -ml-1 inline-block text-zinc-500" />
            }
          />
        </Menu>
      </div>

      <div className="grow">
        <SearchBar />
      </div>

      <div className="-mr-2 flex flex-row items-center">
        <A onClick={() => {}} className="mx-2 inline-block">
          <BellIcon className="w-7 h-7" />
        </A>
        <A onClick={() => {}} className="mx-2 inline-block">
          <ViewGridIcon className="w-7 h-7" />
        </A>
        <A onClick={() => {}} className="mx-2 inline-block">
          <CogIcon className="w-7 h-7" />
        </A>
      </div>
    </div>
  );
};

const SearchBar = () => {
  const workspaceId = useRouterWorkspace();
  const channelId = useRouterChannel();

  const [searchState, setSearchState] = useRecoilState(SearchInputState);
  const { setOpen: setOpenSearch } = useSearchModal();

  const setOpen = () => {
    setSearchState({ query: searchState.query, workspaceId: workspaceId, channelId: channelId });
    setOpenSearch(true);
  };

  return (
    <InputDecorationIcon
      prefix={SearchIcon}
      input={({ className }) => (
        <Input
          value={searchState.query}
          maxLength={0}
          readOnly
          onClick={() => setOpen()}
          className={className + 'max-w-xl text-zinc-500'}
          placeholder={Languages.t('scenes.client.main_view.main_header.search_input_global')}
        />
      )}
    />
  );
};
