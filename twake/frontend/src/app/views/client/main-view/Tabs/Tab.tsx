import React from 'react';
import classNames from 'classnames';
import { TabType } from 'app/features/tabs/types/tab';
import RouterServices from 'app/features/router/services/router-service';
import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/modal/modal-manager';
import WorkspacesApps from 'app/deprecated/workspaces/workspaces_apps.js';
import Menu from 'components/menus/menu.js';
import { MoreHorizontal } from 'react-feather';
import Languages from 'app/features/global/services/languages-service';
import { capitalize } from 'lodash';
import AccessRightsService from 'app/features/workspace-members/services/workspace-members-access-rights-service';
import MainViewService from 'app/features/router/services/main-view-service';
import { getCompanyApplication as getApplication } from 'app/features/applications/state/company-applications';
import { useTab } from 'app/features/tabs/hooks/use-tabs';

type PropsType = {
  tabId: string;
  currentUserId: string;
  selected: boolean;
};

export default ({ selected, tabId, currentUserId }: PropsType): JSX.Element => {
  const { workspaceId, companyId } = RouterServices.getStateFromRoute();
  const { tab, remove, save } = useTab(tabId || '');
  const isCurrentUserAdmin: boolean = AccessRightsService.useWatcher(() =>
    AccessRightsService.hasLevel(workspaceId, 'moderator'),
  );

  if (!tab) {
    return <></>;
  }

  if (selected && tab) {
    MainViewService.select(MainViewService.getId(), {
      context: {
        tabId: tab.id,
        configuration: tab.configuration || {},
        name: tab.name,
        type: 'application',
      },
      app: getApplication(tab.application_id || ''),
      hasTabs: MainViewService.getConfiguration().hasTabs,
    });
  }

  return (
    <span
      className={classNames({
        'tab-component-selected align-items-center': selected,
        'tab-component align-items-center': !selected,
      })}
      onClick={() => {
        const route: string = RouterServices.generateRouteFromState({
          tabId: tab.id,
        });
        return RouterServices.push(route);
      }}
    >
      {WorkspacesApps.getAppIconComponent(tab, { size: 14 })}
      <span className="tab-name small-right-margin">{capitalize(tab.name)}</span>
      {selected &&
        AccessRightsService.hasLevel(workspaceId, 'member') &&
        AccessRightsService.getCompanyLevel(companyId) !== 'guest' && (
          <Menu
            style={{ lineHeight: 0 }}
            menu={[
              {
                type: 'menu',
                text: Languages.t('scenes.app.mainview.tabs.rename'),
                hide: false,
                onClick: () =>
                  ModalManager.open(
                    <TabsTemplateEditor tab={tab} onChangeTabs={(item: TabType) => save(item)} />,
                    {
                      position: 'center',
                      size: { width: '600px', minHeight: '329px' },
                    },
                  ),
              },
              {
                type: 'menu',
                hide: currentUserId !== tab.owner && !isCurrentUserAdmin,
                text: <div style={{ color: 'var(--red)' }}>{Languages.t('general.delete')}</div>,
                onClick: () => remove(),
              },
            ]}
          >
            <MoreHorizontal size={14} />
          </Menu>
        )}
    </span>
  );
};
