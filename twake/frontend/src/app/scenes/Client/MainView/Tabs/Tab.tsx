import React from 'react';
import { TabResource } from 'app/models/Tab';
import RouterServices from 'app/services/RouterService';
import TabsTemplateEditor from './TabsTemplateEditor';
import ModalManager from 'app/components/Modal/ModalManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Menu from 'components/Menus/Menu.js';
import { MoreHorizontal } from 'react-feather';
import Languages from 'services/languages/languages';
import { capitalize } from 'lodash';
import AccessRightsService from 'app/services/AccessRightsService';
import { Typography } from 'antd';
import MainViewService from 'app/services/AppView/MainViewService';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections.js';

type PropsType = {
  tabResource: TabResource;
  upsertTab: (tab: TabResource) => Promise<TabResource>;
  deleteTab: (tab: TabResource) => Promise<void>;
  currentUserId: string;
  selected: boolean;
};

export default ({
  selected,
  tabResource,
  upsertTab,
  deleteTab,
  currentUserId,
}: PropsType): JSX.Element => {
  const { tabId, workspaceId } = RouterServices.getStateFromRoute();

  const isCurrentUserAdmin: boolean = AccessRightsService.useWatcher(() =>
    AccessRightsService.hasLevel(workspaceId || '', 'administrator'),
  );

  if (selected && tabResource?.state?.persisted) {
    MainViewService.select(MainViewService.getId(), {
      collection: MainViewService.getConfiguration().collection,
      context: {
        tabId: tabResource.data.id,
        configuration: tabResource.data.configuration || {},
        name: tabResource.data.name,
      },
      app: DepreciatedCollections.get('applications').find(tabResource.data.application_id),
      hasTabs: MainViewService.getConfiguration().hasTabs,
    });
  }

  return (
    <span
      className="align-items-center"
      onClick={() => {
        const route: string = RouterServices.generateRouteFromState({
          tabId: tabResource.data.id,
        });
        return RouterServices.history.push(route);
      }}
    >
      {WorkspacesApps.getAppIconComponent(tabResource.data, { size: 14 })}
      <Typography.Paragraph
        ellipsis={{
          rows: 1,
          expandable: false,
        }}
        style={{ maxWidth: '108px', marginBottom: 0 }}
        className="tab-name small-right-margin"
      >
        {capitalize(tabResource.data.name)}
      </Typography.Paragraph>
      {tabResource.data.id === tabId && AccessRightsService.hasLevel(workspaceId || '', 'member') && (
        <Menu
          style={{ lineHeight: 0 }}
          menu={[
            {
              type: 'menu',
              text: Languages.t('scenes.app.mainview.tabs.rename'),
              hide: false,
              onClick: () =>
                ModalManager.open(
                  <TabsTemplateEditor
                    tab={tabResource}
                    onChangeTabs={(item: TabResource) => upsertTab(item)}
                  />,
                  {
                    position: 'center',
                    size: { width: '500px', minHeight: '329px' },
                  },
                ),
            },
            {
              type: 'menu',
              hide: currentUserId !== tabResource.data.owner && !isCurrentUserAdmin,
              text: <div style={{ color: 'var(--red)' }}>{Languages.t('general.delete')}</div>,
              onClick: () => deleteTab(tabResource),
            },
          ]}
        >
          <MoreHorizontal size={14} />
        </Menu>
      )}
    </span>
  );
};
