import { ChevronDownIcon, PlusIcon } from '@heroicons/react/outline';
import Avatar from 'app/atoms/avatar';
import { Badge } from 'app/atoms/badge';
import { CheckIcon, SettingsIcon, UsersIcon } from 'app/atoms/icons-agnostic';
import A from 'app/atoms/link';
import { Base, Info, Title } from 'app/atoms/text';
import LockedWorkspacePopup from 'app/components/locked-features-components/locked-workspace-popup/locked-workspace-popup';
import Menu from 'app/components/menus/menu';
import menusManager from 'app/components/menus/menus-manager';
import ModalManager from 'app/components/modal/modal-manager';
import ModalManagerDepreciated from 'app/deprecated/popupManager/popupManager';
import PopupService from 'app/deprecated/popupManager/popupManager.js';
import FeatureTogglesService, {
  FeatureNames,
} from 'app/features/global/services/feature-toggles-service';
import Languages from 'app/features/global/services/languages-service';
import useRouterCompany from 'app/features/router/hooks/use-router-company';
import RouterService from 'app/features/router/services/router-service';
import { useNotifications } from 'app/features/users/hooks/use-notifications';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import { useCurrentWorkspace, useWorkspaces } from 'app/features/workspaces/hooks/use-workspaces';
import WorkspaceUserRights from 'app/features/workspaces/services/workspace-user-rights-service';
import Block from 'app/molecules/grouped-rows/base';
import { useEffect } from 'react';
import CreateWorkspacePage from '../popup/CreateWorkspacePage/CreateWorkspacePage';
import WorkspaceParameter from '../popup/WorkspaceParameter/WorkspaceParameter';

export const WorkspaceSelector = () => {
  const companyId = useRouterCompany();
  const workspaceId = useRouterCompany();
  const { refresh } = useWorkspaces(companyId);

  const showWorkspaceUsers =
    !WorkspaceUserRights.isGroupInvite() &&
    (AccessRightsService.hasLevel(workspaceId, 'member') ||
      AccessRightsService.hasCompanyLevel(companyId, 'admin'));
  const showWorkspaceParameters =
    WorkspaceUserRights.hasWorkspacePrivilege() && !WorkspaceUserRights.isInvite();

  useEffect(() => {
    companyId && refresh();
  }, [companyId]);

  return (
    <div className="w-full mb-2 bg-white dark:bg-zinc-700 rounded-lg p-3 flex flex-row items-center">
      <div className="grow">
        <Menu
          options={{ menuClassName: '!w-80' }}
          menu={<WorkspaceSelectorList />}
          position="bottom"
          className="flex cursor-pointer w-auto"
        >
          <CurrentWorkspace />
        </Menu>
      </div>
      {showWorkspaceUsers && (
        <A
          onClick={() => {
            ModalManagerDepreciated.open(
              <WorkspaceParameter initial_page={2} />,
              true,
              'workspace_parameters',
            );
          }}
          className="ml-3"
        >
          <UsersIcon className="h-5 w-5" />
        </A>
      )}
      {showWorkspaceParameters && (
        <A
          onClick={() => {
            ModalManagerDepreciated.open(<WorkspaceParameter />, true, 'workspace_parameters');
          }}
          className="ml-3 mr-1"
        >
          <SettingsIcon className="h-5 w-5" />
        </A>
      )}
    </div>
  );
};

const CurrentWorkspace = () => {
  const { workspace } = useCurrentWorkspace();
  const { badges } = useNotifications();

  return (
    <Block
      className="flex cursor-pointer w-auto"
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

      <Block
        onClick={() => {
          if (FeatureTogglesService.isActiveFeatureName(FeatureNames.MULTIPLE_WORKSPACES)) {
            ModalManagerDepreciated.open(<CreateWorkspacePage />);
          } else {
            ModalManager.open(
              <LockedWorkspacePopup />,
              {
                position: 'center',
                size: { width: '600px' },
              },
              false,
            );
          }
        }}
        className="w-auto flex cursor-pointer -mx-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
        title={
          <Base>{Languages.t('scenes.app.channelsbar.currentuser.create_workspace_page')}</Base>
        }
        avatar={<PlusIcon className="h-5 w-5" />}
      />
    </div>
  );
};
