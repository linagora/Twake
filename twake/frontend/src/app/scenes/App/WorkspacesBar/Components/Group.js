import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import Groups from 'services/workspaces/groups.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'services/Menus/MenusManager.js';
import popupManager from 'services/popupManager/popupManager.js';
import CreateCompanyView from 'scenes/App/Popup/CreateCompanyView/CreateCompanyView.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';
import Notifications from 'services/user/notifications.js';
import GroupSwitch from 'components/Leftbar/GroupSwitch/GroupSwitch.js';
import Emojione from 'components/Emojione/Emojione';

export default class Group extends Component {
  constructor() {
    super();

    this.state = {
      groups_repository: Collections.get('groups'),
      groups: Groups,
    };

    Groups.addListener(this);
    Collections.get('groups').addListener(this);
    Notifications.addListener(this);
  }
  componentWillUnmount() {
    Collections.get('groups').removeListener(this);
    Groups.removeListener(this);
    Notifications.removeListener(this);
  }
  renderGroupInMenu(group) {
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
            {group.logo && <Emojione type={window.addApiUrlIfNeeded(group.logo)} />}
            {!group.logo && (
              <div className="letter">
                {((group.mininame || group.name) + '-')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="text">{group.name}</div>
          {!!(Notifications.notification_by_group[group.id] || {}).count && (
            <div className="group_notification">
              <div className={'badge circle'}>
                {(Notifications.notification_by_group[group.id] || {}).count || 0}
              </div>
            </div>
          )}
        </div>,
      ],
    };
  }
  openMenu(evt) {
    var group = this.group;

    this.change_group_menu = [];
    this.change_group_menu.push({
      type: 'title',
      text: Languages.t(
        'scenes.app.workspacesbar.components.change_company_title',
        [],
        'Change company',
      ),
    });
    Groups.getOrderedGroups().map(item => {
      this.change_group_menu.push(this.renderGroupInMenu(item));
    });
    this.change_group_menu.push({
      type: 'menu',
      text: Languages.t(
        'scenes.app.workspacesbar.components.create_company_menu',
        [],
        'Créer une entreprise',
      ),
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

    var pos = window.getBoundingClientRect(this.node);
    pos.x = pos.x || pos.left;
    pos.y = pos.y || pos.top;

    MenusManager.openMenu(this.change_group_menu, { x: pos.x, y: pos.y - 10 }, 'top');
  }
  render() {
    if (!this.props.group) {
      return '';
    }

    this.group = Collections.get('groups').known_objects_by_id[this.props.group.id];
    if (!this.group) {
      return '';
    }

    var notifications = 0;

    Object.keys(Notifications.notification_by_group).forEach(group_id => {
      if (group_id != this.group.id) {
        notifications += (Notifications.notification_by_group[group_id] || {}).count || 0;
      }
    });

    return (
      <GroupSwitch
        refLogo={node => (this.node = node)}
        group={this.group}
        notifications={notifications || 0}
        onClick={evt => {
          this.openMenu(evt);
        }}
      />
    );
  }
}
