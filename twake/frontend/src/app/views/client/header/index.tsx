import { ChevronDownIcon, SearchIcon } from '@heroicons/react/outline';
import Avatar from 'app/atoms/avatar';
import { AppsIcon, BellIcon, CheckIcon, SettingsIcon } from 'app/atoms/icons-agnostic';
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
import { Badge } from 'app/atoms/badge';
import { useNotifications } from 'app/features/users/hooks/use-notifications';

export const MainHeader = () => {
  return (
    <div className="flex flex-row items-center px-4 py-3">
      <div className="sm:ml-0 ml-12 grow max-w-xs flex items-center" style={{ minWidth: 80 }}>
        <Menu
          options={{ menuClassName: '!w-80' }}
          menu={<CompanySelector />}
          position="bottom"
          className="inline-flex cursor-pointer"
        >
          <CurrentCompany />
        </Menu>
      </div>

      <div className="grow">
        <SearchBar />
      </div>

      <div className="-mr-2 flex flex-row items-center">
        <A onClick={() => {}} className="mx-2 inline-block">
          <BellIcon className="w-6 h-6" />
        </A>
        <A onClick={() => {}} className="mx-2 inline-block">
          <AppsIcon className="w-6 h-6" />
        </A>
        <A onClick={() => {}} className="mx-2 inline-block">
          <SettingsIcon className="w-6 h-6" />
        </A>
      </div>
    </div>
  );
};

const CurrentCompany = () => {
  const { company } = useCurrentCompany();
  const { badges } = useNotifications();

  return (
    <Block
      className="inline-flex cursor-pointer"
      avatar={
        <>
          <Avatar avatar={company?.logo} title={company?.name} />
          {badges.filter(b => b.company_id !== company?.id).length > 0 && (
            <Badge
              theme="danger"
              size="sm"
              className="border-2 border-white dark:border-zinc-800 absolute top-0 right-0 h-4 w-4 rounded-full -translate-y-0.5 translate-x-0.5"
            />
          )}
        </>
      }
      title={<span className="sm:inline hidden">{company?.name}</span>}
      title_suffix={
        <ChevronDownIcon className="h-4 w-4 sm:ml-1 -ml-1 inline-block text-zinc-500" />
      }
    />
  );
};

const CompanySelector = () => {
  const { company } = useCurrentCompany();
  const { user } = useCurrentUser();
  const { badges } = useNotifications();

  return (
    <div className="-mb-2">
      <Title>Companies</Title>
      <Info>Your active companies</Info>
      <hr className="-mx-4 mt-3 mb-2" />
      {[...(user?.companies || [])]
        .sort((a, b) => a.company.name.localeCompare(b.company.name))
        .map(c => (
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
            className="w-auto flex cursor-pointer -mx-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            avatar={
              <>
                <Avatar avatar={c.company?.logo} title={c.company?.name} />
                {badges.filter(b => b.company_id === c.company.id).length > 0 && (
                  <Badge
                    theme="danger"
                    size="sm"
                    className="border-2 border-white dark:border-zinc-800 absolute top-0 right-0 h-4 w-4 rounded-full -translate-y-0.5 translate-x-0.5"
                  />
                )}
              </>
            }
            title={<span>{c?.company?.name}</span>}
            subtitle={<Info>{user?.email}</Info>}
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
          className={className + 'sm:max-w-xl max-w-xs text-zinc-500'}
          placeholder={Languages.t('scenes.client.main_view.main_header.search_input_global')}
        />
      )}
    />
  );
};
