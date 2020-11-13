import React, { Component, useState } from 'react';

import Languages from 'services/languages/languages.js';
import ChannelsService from 'services/channels/channels.js';
import Collections from 'services/Collections/Collections.js';
import Emojione from 'components/Emojione/Emojione';
import Icon from 'components/Icon/Icon.js';
import Rounded from 'components/Inputs/Rounded.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'services/Menus/MenusManager.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import popupManager from 'services/popupManager/popupManager.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import DroppableZone from 'components/Draggable/DroppableZone.js';
import ConnectorsListManager from 'components/ConnectorsListManager/ConnectorsListManager.js';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

const TabEditor = props => {
  const [tabName, setTabName] = useState(props.value || '');
  return (
    <>
      <div>
        <Input
          className="medium full_width bottom-margin"
          refInput={node => (node ? node.focus() : '')}
          type="text"
          defaultValue={tabName}
          onChange={evt => setTabName(evt.target.value)}
          placeholder={Languages.t(
            'scenes.app.mainview.tabs.placeholder_name_tab',
            [],
            "Nom de l'onglet",
          )}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              props.editTab(tabName);
            }
          }}
        />
      </div>
      <div className="menu-buttons">
        <Button
          disabled={tabName.length <= 0}
          type="button"
          value={
            props.edition
              ? Languages.t('scenes.app.mainview.tabs.save_tab', [], 'Enregistrer')
              : Languages.t('scenes.app.mainview.tabs.add_tab', [], 'Ajouter')
          }
          onClick={() => props.editTab(tabName)}
        />
      </div>
    </>
  );
};

export default class Tabs extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      channels: ChannelsService,
      tab_name: '',
    };

    Languages.addListener(this);
    ChannelsService.addListener(this);
    Collections.get('channels').addListener(this);
    Collections.get('applications').addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    ChannelsService.removeListener(this);
    Collections.get('channels').removeListener(this);
    Collections.get('applications').removeListener(this);
  }
  editTab(id, name, app_id) {
    ChannelsService.saveTab(this.props.channel.id, app_id, name, undefined, id);
    MenusManager.closeMenu();
  }
  editTabMenu(app, id, evt) {
    var tab = null;
    if (id) {
      tab = Collections.get('channel_tabs').find(id);
      if (!tab) {
        return;
      }
    }
    var menu = [
      { type: 'title', text: app.name },
      {
        type: 'react-element',
        reactElement: () => (
          <TabEditor
            edition={!!id}
            value={id ? tab.name : ''}
            editTab={tabName => this.editTab(id, tabName, app.id)}
          />
        ),
      },
    ];
    MenusManager.openMenu(menu, { x: evt.clientX, y: evt.clientY }, 'center');
  }
  dropFile(data) {
    console.log(data);
  }
  configureChannelConnector(app) {
    var data = {
      channel: this.props.channel,
    };
    WorkspacesApps.notifyApp(app.id, 'configuration', 'channel', data);
  }
  renderTab(tab, first) {
    var app = null;
    if (tab) {
      app = Collections.get('applications').find(tab.app_id);
      if (!app) {
        return '';
      }
    }

    var icon = 'comments-alt';
    var emoji = '';
    if (app) {
      icon = WorkspacesApps.getAppIcon(app);
    }

    var force_icon = ((tab || {}).configuration || {}).icon;
    if (tab && tab.configuration && tab.configuration.icon) {
      icon = tab.configuration.icon;
    }

    if (icon && (icon || '').indexOf('http') === 0) {
      emoji = icon;
      icon = '';
    }

    return (
      <DroppableZone
        types={['file']}
        onDrop={data => this.dropFile(data)}
        className={'tab ' + (this.props.currentTab == (tab ? tab.id : null) ? 'is_selected ' : '')}
        onClick={() => ChannelsService.selectTab(tab)}
      >
        {(first || force_icon) && (
          <div className="icon">
            {icon && <Icon className="tab-app-icon" type={icon} />}
            {emoji && <Emojione className="tab-app-icon" type={emoji} />}
          </div>
        )}
        {tab ? tab.name : Languages.t('scenes.app.mainview.discussion', [], 'Discussion')}
        {WorkspaceUserRights.hasWorkspacePrivilege() && tab && this.props.currentTab == tab.id && (
          <Menu
            menu={[
              {
                type: 'menu',
                text: Languages.t('scenes.app.mainview.tabs.rename', [], 'Renommer'),
                onClick: evt => {
                  this.editTabMenu(app, tab.id, evt);
                },
              },
              {
                type: 'menu',
                className: 'error',
                text: Languages.t('scenes.app.mainview.tabs.remove_tab', [], "Supprimer l'onglet"),
                onClick: () => {
                  ChannelsService.selectTab(null);
                  ChannelsService.removeTab(this.props.channel.id, app.id, tab.id);
                },
              },
            ]}
            className="options"
          >
            <Icon type="ellipsis-h" />
          </Menu>
        )}
        {WorkspaceUserRights.hasWorkspacePrivilege() &&
          !tab &&
          this.props.currentTab == null &&
          !this.props.channel.direct && (
            <Menu
              menu={[
                {
                  type: 'menu',
                  text: Languages.t(
                    'scenes.app.mainview.tabs.connectors_menu',
                    [],
                    'Connecteurs...',
                  ),
                  submenu: [
                    {
                      type: 'react-element',
                      reactElement: level => {
                        var apps = WorkspacesApps.getApps().filter(
                          app => (app.display || {}).channel,
                        );
                        if (apps.length > 0) {
                          return (
                            <ConnectorsListManager
                              list={apps}
                              current={(this.props.channel.connectors || [])
                                .map(id => Collections.get('applications').find(id))
                                .filter(item => item)}
                              configurable={item =>
                                ((item.display || {}).configuration || {}).can_configure_in_channel
                              }
                              onChange={ids => {
                                this.props.channel.connectors = ids;
                                Collections.get('channels').save(this.props.channel);
                              }}
                              onConfig={app => {
                                this.configureChannelConnector(app);
                              }}
                            />
                          );
                        }
                        return (
                          <div className="menu-text">
                            {Languages.t(
                              'scenes.app.mainview.tabs.no_connected_connectors_for_channel',
                              [],
                              "Vous n'avez aucun connecteur capable de se connecter à une chaîne.",
                            )}
                          </div>
                        );
                      },
                    },
                    { type: 'separator' },
                    {
                      type: 'menu',
                      text: Languages.t(
                        'scenes.app.mainview.tabs.searching_connectors',
                        [],
                        'Chercher des connecteurs...',
                      ),
                      onClick: () => {
                        popupManager.open(
                          <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
                          true,
                          'workspace_parameters',
                        );
                      },
                    },
                  ],
                },
              ]}
              className="options"
            >
              <Icon type="ellipsis-h" />
            </Menu>
          )}
      </DroppableZone>
    );
  }
  render() {
    var current_channel = Collections.get('channels').findByFrontId(
      this.state.channels.currentChannelFrontId,
    );

    if (current_channel.direct || current_channel.application) {
      return <div className="tabs" />;
    }

    var i_user = 0;

    if (!current_channel) {
      return <div className="main_view" />;
    }

    if (current_channel.app_id) {
      current_channel.app = Collections.get('applications').find(current_channel.app_id) || {};
      if (!current_channel.app.id) {
        WorkspacesApps.getApp(current_channel.app_id);
        return <div className="main_view" />;
      }
    }

    var tabs_groups = [];
    (this.props.channel.tabs || []).map(tab => {
      if (!tabs_groups[tab.app_id]) {
        tabs_groups[tab.app_id] = [];
      }
      tabs_groups[tab.app_id].push(tab);
    });

    var connectors_menu = [];
    var apps = WorkspacesApps.getApps().filter(app => (app.display || {}).channel_tab);
    if (apps.length > 0) {
      apps.map(app => {
        var icon = WorkspacesApps.getAppIcon(app);
        var emoji = '';
        if ((icon || '').indexOf('http') === 0) {
          emoji = icon;
          icon = '';
        }

        connectors_menu.push({
          type: 'menu',
          text: app.name,
          icon: icon,
          emoji: emoji,
          onClick: evt => {
            this.editTabMenu(app, null, evt);
          },
        });
      });
    } else {
      connectors_menu.push({
        type: 'react-element',
        reactElement: (
          <div className="menu-text">
            {Languages.t(
              'scenes.app.mainview.tabs.no_connected_connectors_for_tab',
              [],
              "Vous n'avez aucun connecteur capable créer un onglet.",
            )}
          </div>
        ),
      });
    }
    connectors_menu.push({ type: 'separator' });
    connectors_menu.push({
      type: 'menu',
      text: Languages.t(
        'scenes.app.mainview.tabs.searching_connectors',
        [],
        'Chercher des connecteurs...',
      ),
      onClick: () => {
        popupManager.open(
          <WorkspaceParameter initial_page={3} options={'open_search_apps'} />,
          true,
          'workspace_parameters',
        );
      },
    });

    return (
      <div className="tabs">
        {this.renderTab(null, true)}

        {Object.keys(tabs_groups).map(tab_group_key => {
          var tab_group = tabs_groups[tab_group_key];
          var i = 0;
          return (
            <div className="tab_group">
              {tab_group.map(tab => {
                i++;
                return this.renderTab(tab, i == 1);
              })}
            </div>
          );
        })}

        {WorkspaceUserRights.hasWorkspacePrivilege() && !this.props.channel.direct && (
          <Menu className="tab_add_menu" menu={connectors_menu}>
            <Rounded className="tab_add" />
          </Menu>
        )}
      </div>
    );
  }
}
