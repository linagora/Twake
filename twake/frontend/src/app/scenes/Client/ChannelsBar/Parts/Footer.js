import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import Groups from 'services/workspaces/groups.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import InitService from 'services/InitService';
import UserService from 'services/user/UserService';

import FooterUI from 'app/scenes/Client/ChannelsBar/Parts/Footer/Footer.js';

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
        planName={group?.plan}
        onClickHelp={
          InitService.server_infos?.configuration?.help_url &&
          (() => {
            window.open(InitService.server_infos?.configuration?.help_url);
          })
        }
        onClickDocumentation={() => {
          window.open('https://doc.twake.app/how-to-use-it/welcome');
        }}
      />
    );
  }
}
