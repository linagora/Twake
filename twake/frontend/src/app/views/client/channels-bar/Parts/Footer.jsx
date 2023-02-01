import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import Groups from 'app/deprecated/workspaces/groups.js';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import InitService from 'app/features/global/services/init-service';

import FooterUI from 'app/views/client/channels-bar/Parts/Footer/Footer.jsx';

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
          window.open('https://linagora.github.io/Twake/index.html');
        }}
      />
    );
  }
}
