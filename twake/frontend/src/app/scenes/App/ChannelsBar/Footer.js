import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Groups from 'services/workspaces/groups.js';
import Collections from 'services/Collections/Collections.js';
import LoginService from 'services/login/login.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import PopupManager from 'services/popupManager/popupManager.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';

import FooterUI from 'components/Leftbar/Footer/Footer.js';

export default class Footer extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
    Collections.get('groups').addListener(this);
    Collections.get('groups').listenOnly(this, [Groups.currentGroupId]);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('groups').removeListener(this);
  }
  shouldComponentUpdate() {
    Collections.get('groups').listenOnly(this, [Groups.currentGroupId]);
    return true;
  }
  render() {
    var group = Collections.get('groups').find(Groups.currentGroupId);

    return (
      <FooterUI
        planName={group.plan}
        onClickPlan={() => {
          if (false && WorkspaceUserRights.hasGroupPrivilege('MANAGE_PRICINGS')) {
            PopupManager.open(
              <WorkspaceParameter initial_page={5} />,
              true,
              'workspace_parameters',
            );
          }
        }}
        onClickHelp={
          LoginService.server_infos.help_link &&
          (() => {
            window.open(LoginService.server_infos.help_link);
          })
        }
      />
    );
  }
}
