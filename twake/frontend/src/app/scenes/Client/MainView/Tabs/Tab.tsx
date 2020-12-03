import React from 'react';
import { TabType, TabResource } from 'app/models/Tab';
import RouterServices from 'app/services/RouterService';
import TabsTemplateEditor from './TabsTemplateEditor';
import DepreciatedCollections from 'app/services/Depreciated/Collections/Collections';
import Icon from 'app/components/Icon/Icon';
import ModalManager from 'services/Modal/ModalManager';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Menu from 'components/Menus/Menu.js';
import { MoreHorizontal } from 'react-feather';
import Languages from 'services/languages/languages';
import { capitalize } from 'lodash';
import AccessRightsService from 'app/services/AccessRightsService';
import Collections from 'app/services/Collections/Collections';
import { ChannelResource } from 'app/models/Channel';
import { Typography } from 'antd';

type PropsType = {
  tabResource: TabResource;
  upsertTab: (tab: TabResource) => Promise<TabResource>;
  deleteTab: (tab: TabResource) => Promise<void>;
  currentUserId: string;
};

export default ({ tabResource, upsertTab, deleteTab, currentUserId }: PropsType) => {
  const { workspaceId, companyId, channelId, tabId } = RouterServices.useStateFromRoute();
  const collectionPath = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/::mine`;
  const ChannelsCollections = Collections.get(collectionPath, ChannelResource);

  // Not working at this moment, waiting to channel owner fix
  const isChannelOwner = async () => {
    const currentChannel = await ChannelsCollections.findOne(channelId);
    return currentChannel && currentUserId === currentChannel.data.owner ? true : false;
  };

  const isCurrentUserAdmin: boolean = AccessRightsService.useWatcher(() =>
    AccessRightsService.hasRight(workspaceId || '', 'administrator'),
  );
  const getAppIcon = (tab: TabType) => {
    const application = DepreciatedCollections.get('applications').find(tab.application_id);
    const IconType = WorkspacesApps.getAppIcon(application, true);

    if (typeof IconType === 'string') {
      return (
        <Icon type={IconType} style={{ width: 16, height: 16 }} className="small-right-margin" />
      );
    } else {
      return <IconType size={16} className="small-right-margin" />;
    }
  };

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
      {getAppIcon(tabResource)}
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
      {tabResource.data.id === tabId && (
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
              hide:
                currentUserId !== tabResource.data.owner &&
                !isCurrentUserAdmin /*&&
                isChannelOwner()*/,
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
