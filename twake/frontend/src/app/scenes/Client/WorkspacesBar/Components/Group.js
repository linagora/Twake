import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections';
import Groups from 'services/workspaces/groups';
import Menu from 'components/Menus/Menu';
import MenusManager from 'app/components/Menus/MenusManager';
import popupManager from 'services/popupManager/popupManager';
import CreateCompanyView from 'app/scenes/Client/Popup/CreateCompanyView/CreateCompanyView';
import WorkspaceParameter from 'app/scenes/Client/Popup/WorkspaceParameter/WorkspaceParameter';
import GroupSwitch from 'app/scenes/Client/WorkspacesBar/Components/GroupSwitch/GroupSwitch';
import Emojione from 'components/Emojione/Emojione';
import InitService from 'app/services/InitService';
import { Collection } from 'services/CollectionsReact/Collections';
import { NotificationResource } from 'app/models/Notification';
import { addApiUrlIfNeeded } from 'app/services/utils/URLUtils';

export default class Group extends Component {
  constructor() {
    super();

    this.state = {
      groups_repository: Collections.get('groups'),
      groups: Groups,
    };

    Groups.addListener(this);
    Collections.get('groups').addListener(this);
  }
  componentWillUnmount() {
    Collections.get('groups').removeListener(this);
    Groups.removeListener(this);
  }
  renderGroupInMenu(group) {
    const notificationsCollection = Collection.get(
      '/notifications/v1/badges/',
      NotificationResource,
    );
    const notifications = notificationsCollection.find({ company_id: group.id }).length;

    return {
      type: 'react-element',
      reactElement: [
        <div
          style={{ display: 'flex' }}
          className="menu group_in_selector"
          onClick={() => {
            Groups.select(group);
            Menu.closeAll();
          }}
        >
          <div className="icon">
            {group.logo && <Emojione type={addApiUrlIfNeeded(group.logo)} />}
            {!group.logo && (
              <div className="letter">
                {((group.mininame || group.name) + '-')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="text">{group.name}</div>
          {notifications > 0 && (
            <div className="group_notification">
              <div className={'badge circle'}>{notifications || 0}</div>
            </div>
          )}
        </div>,
      ],
    };
  }
  openMenu(evt) {
    var group = this.group;

    this.change_group_menu = [];

    if (Groups.getOrderedGroups().length > 1) {
      this.change_group_menu.push({
        type: 'title',
        text: Languages.t(
          'scenes.app.workspacesbar.components.change_company_title',
          [],
          'Change company',
        ),
      });
    }

    Groups.getOrderedGroups().map(item => {
      this.change_group_menu.push(this.renderGroupInMenu(item));
    });
    if (InitService.server_infos?.configuration?.accounts?.type !== 'console') {
      this.change_group_menu.push({
        type: 'menu',
        text: Languages.t('scenes.app.workspacesbar.components.create_company_menu'),
        icon: 'plus',
        onClick: () => {
          popupManager.open(<CreateCompanyView />);
        },
      });

      this.change_group_menu.push({ type: 'separator' });
      this.change_group_menu.push({
        type: 'menu',
        icon: 'cog',
        text: Languages.t(
          'scenes.app.workspacesbar.components.grp_parameters',
          [group.name],
          'Paramètres de $1',
        ),
        onClick: () => {
          popupManager.open(<WorkspaceParameter initial_page={4} />, true, 'workspace_parameters');
        },
      });
    }

    var pos = window.getBoundingClientRect(this.node);
    pos.x = pos.x || pos.left;
    pos.y = pos.y || pos.top;

    MenusManager.openMenu(this.change_group_menu, { x: pos.x, y: pos.y - 10 }, 'top');
  }
  render() {
    this.group = Collections.get('groups').find(this.props.selected);
    if (!this.group) {
      return '';
    }

    return (
      <GroupSwitch
        refLogo={node => (this.node = node)}
        group={this.group}
        onClick={evt => {
          this.openMenu(evt);
        }}
      />
    );
  }
}
