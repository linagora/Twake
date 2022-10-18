import { useState } from 'react';

import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import popupManager from 'app/deprecated/popupManager/popupManager.js';
import WorkspaceService from 'app/deprecated/workspaces/workspaces.js';
import ConsoleService from 'app/features/console/services/console-service';
import InitService from 'app/features/global/services/init-service';
import Languages from 'app/features/global/services/languages-service';
import WorkspaceUserRights from 'app/features/workspaces/services/workspace-user-rights-service';
import MenuList from 'components/menus/menu-component.js';
import CompanyIntegration from './WorkspacePages/CompanyIntegrations';
import WorkspacePartner from './WorkspacePages/WorkspacePartner';

import { useCurrentUser } from 'app/features/users/hooks/use-current-user';
import { useCurrentWorkspace } from 'app/features/workspaces/hooks/use-workspaces';
import Account from './UserPages/Account';
import Assistant from './UserPages/Assistant';
import Notifications from './UserPages/Notifications';
import './UserParameter.scss';
import WorkspaceIdentity from './WorkspacePages/Workspace/WorkspaceIdentity';
import './WorkspaceParameter.scss';

export default (props: { initial_page?: number; options?: any }) => {
  const { workspace } = useCurrentWorkspace();

  const [page, _setPage] = useState(props.initial_page || 11);
  const setPage = (page: number) => {
    popupManager.popupStates['workspace_parameters'] = page;
    _setPage(page);
  };

  const displayScene = () => {
    if (WorkspaceUserRights.hasWorkspacePrivilege() && page === 1) {
      return <WorkspaceIdentity />;
    }
    if (page === 2) {
      return <WorkspacePartner />;
    }
    if (WorkspaceUserRights.hasWorkspacePrivilege() && page === 3) {
      return <CompanyIntegration />;
    }
    if (page === 5) {
      return (
        <div className="">
          <div className="title">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.payments_subscriptions_title',
              [],
              'Paiements et abonnements',
            )}
          </div>

          <div className="group_section" />
        </div>
      );
    }
    if (WorkspaceUserRights.hasWorkspacePrivilege() && page === 11) {
      return <Account />;
    }
    if (WorkspaceUserRights.hasWorkspacePrivilege() && page === 14) {
      return <Assistant />;
    }
    if (WorkspaceUserRights.hasWorkspacePrivilege() && page === 13) {
      return <Notifications />;
    }
  };

  const subText = (
    <div>
      {Languages.t(
        'scenes.app.channelsbar.currentuser.workspace_info',
        [
          Collections.get('workspaces').find(WorkspaceService.currentWorkspaceId).name,
          Collections.get('groups').find(WorkspaceService.currentGroupId).name,
        ],
        "Vous êtes dans l'espace de travail $1 du groupe $2.",
      )}
      <br />
      <br />
      {WorkspaceUserRights.hasWorkspacePrivilege() && WorkspaceUserRights.hasGroupPrivilege() && (
        <span>
          {Languages.t(
            'scenes.app.popup.workspaceparameter.admin_manager_current_status',
            [],
            "Vous êtes Administrateur et Gérant de l'entreprise.",
          )}
        </span>
      )}
      {WorkspaceUserRights.hasWorkspacePrivilege() && !WorkspaceUserRights.hasGroupPrivilege() && (
        <span>
          {Languages.t(
            'scenes.app.popup.workspaceparameter.admin_current_status',
            [],
            'Vous êtes Administrateur.',
          )}
        </span>
      )}
      {!WorkspaceUserRights.hasWorkspacePrivilege() && WorkspaceUserRights.hasGroupPrivilege() && (
        <span>
          {Languages.t(
            'scenes.app.popup.workspaceparameter.manager_current_status',
            [],
            "Vous êtes Gérant de l'entreprise.",
          )}
        </span>
      )}
    </div>
  );

  const menu: any[] = [
    {
      type: 'menu',
      text: Languages.t('scenes.apps.account.title'),
      emoji: ':dark_sunglasses:',
      selected: page === 11 ? 'selected' : '',
      onClick: () => {
        setPage(11);
      },
    },
    {
      type: 'menu',
      text: Languages.t('scenes.apps.account.assistant.title'),
      emoji: ':robot:',
      hide:
        document.location.origin === 'https://web.twake.app' &&
        workspace?.company_id !== '56393af2-e5fe-11e9-b894-0242ac120004',
      selected: page === 14 ? 'selected' : '',
      onClick: () => {
        setPage(14);
      },
    },
    {
      type: 'menu',
      text: Languages.t('scenes.apps.account.notifications.title'),
      emoji: ':bell:',
      selected: page === 13 ? 'selected' : '',
      onClick: () => {
        setPage(13);
      },
    },
    { type: 'separator' },
  ];

  if (WorkspaceUserRights.hasWorkspacePrivilege()) {
    menu.push({
      type: 'menu',
      emoji: ':house_with_garden:',
      text:
        Languages.t(
          'scenes.apps.parameters.workspace_sections.workspace',
          [],
          'Espace de travail',
        ) +
        ' ' +
        workspace?.name,
      selected: page === 1 ? 'selected' : '',
      onClick: () => {
        setPage(1);
      },
    });
    menu.push({
      type: 'menu',
      emoji: ':electric_plug:', // WORKSPACE INTEGRATION
      text: Languages.t('scenes.app.popup.workspaceparameter.pages.apps_connectors_title'),
      selected: page === 3 ? 'selected' : '',
      onClick: () => {
        setPage(3);
      },
    });
  }
  if (!WorkspaceUserRights.isGroupInvite()) {
    menu.push({
      type: 'menu',
      emoji: ':handshake:',
      text: Languages.t(
        'scenes.app.popup.workspaceparameter.pages.collaborateurs',
        [],
        'Collaborateurs',
      ),
      selected: page === 2 ? 'selected' : '',
      onClick: () => {
        setPage(2);
      },
    });
  }

  if (
    WorkspaceUserRights.hasGroupPrivilege() &&
    InitService.server_infos?.configuration?.accounts?.type === 'console'
  ) {
    menu.push({ type: 'separator' });
    menu.push({
      type: 'menu',
      emoji: ':clipboard:',
      text: Languages.t(
        'scenes.app.popup.workspaceparameter.pages.company_identity_title',
        [],
        "Identité de l'entreprise",
      ),
      selected: page === 4 ? 'selected' : '',
      onClick: () => {
        return window.open(
          ConsoleService.getCompanyManagementUrl(WorkspaceService.currentGroupId),
          '_blank',
        );
      },
    });
  }

  menu.push({ type: 'text', text: subText });

  return (
    <div className="workspaceParameter fade_in">
      <div className="main">
        <div className="sideBar">
          <MenuList menu={menu} />
        </div>
        <div className="content">{displayScene()}</div>
      </div>
    </div>
  );
};
