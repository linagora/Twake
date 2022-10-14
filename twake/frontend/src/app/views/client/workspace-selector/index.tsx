import { CheckIcon, ChevronDownIcon } from '@heroicons/react/outline';
import Avatar from 'app/atoms/avatar';
import { Badge } from 'app/atoms/badge';
import { Info, Title } from 'app/atoms/text';
import Menu from 'app/components/menus/menu';
import menusManager from 'app/components/menus/menus-manager';
import PopupService from 'app/deprecated/popupManager/popupManager.js';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import RouterService from 'app/features/router/services/router-service';
import { useNotifications } from 'app/features/users/hooks/use-notifications';
import { useCurrentWorkspace, useWorkspaces } from 'app/features/workspaces/hooks/use-workspaces';
import Block from 'app/molecules/grouped-rows/base';
import { useEffect } from 'react';

export const WorkspaceSelector = () => {
  const companyId = useRouterCompany();
  const { refresh } = useWorkspaces(companyId);

  useEffect(() => {
    companyId && refresh();
  }, [companyId]);

  return (
    <div className="w-full mb-2 bg-white dark:bg-zinc-700 rounded-lg p-3">
      <Menu
        options={{ menuClassName: '!w-80' }}
        menu={<WorkspaceSelectorList />}
        position="bottom"
        className="flex cursor-pointer w-full"
      >
        <CurrentWorkspace />
      </Menu>
    </div>
  );
};

const CurrentWorkspace = () => {
  const { workspace } = useCurrentWorkspace();
  const { badges } = useNotifications();

  return (
    <Block
      className="flex cursor-pointer w-full"
      avatar={
        <>
          <Avatar type="square" avatar={workspace?.logo} title={workspace?.name} />
          {badges.filter(
            b =>
              b.company_id === workspace?.company_id &&
              b.workspace_id !== workspace?.id &&
              b.workspace_id !== 'direct',
          ).length > 0 && (
            <Badge
              theme="danger"
              size="sm"
              className="border-2 border-white dark:border-zinc-800 absolute top-0 right-0 h-4 w-4 rounded-full -translate-y-0.5 translate-x-0.5"
            />
          )}
        </>
      }
      title={<span className="sm:inline hidden">{workspace?.name}</span>}
      title_suffix={
        <ChevronDownIcon className="h-4 w-4 sm:ml-1 -ml-1 inline-block text-zinc-500" />
      }
    />
  );
};

const WorkspaceSelectorList = () => {
  const companyId = useRouterCompany();
  const { workspace } = useCurrentWorkspace();
  const { badges } = useNotifications();
  const { workspaces } = useWorkspaces(companyId);

  return (
    <div className="-mb-2">
      <Title>Workspaces</Title>
      <Info>Available workspaces in this company</Info>
      <hr className="-mx-4 mt-3 mb-2" />
      {[...workspaces]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(w => w)
        .map(w => (
          <Block
            onClick={() => {
              PopupService.closeAll();
              menusManager.closeMenu();
              RouterService.push(
                RouterService.generateRouteFromState(
                  {
                    companyId: w.company_id,
                    workspaceId: w.id,
                  },
                  { replace: true },
                ),
              );
            }}
            key={w.id}
            className="w-auto flex cursor-pointer -mx-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            avatar={
              <>
                <Avatar type="square" avatar={w?.logo} title={w?.name} />
                {badges.filter(b => b.workspace_id === w.id).length > 0 && (
                  <Badge
                    theme="danger"
                    size="sm"
                    className="border-2 border-white dark:border-zinc-800 absolute top-0 right-0 h-4 w-4 rounded-full -translate-y-0.5 translate-x-0.5"
                  />
                )}
              </>
            }
            title={<span className="sm:inline hidden">{w?.name}</span>}
            suffix={
              (w.id === workspace?.id && (
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
