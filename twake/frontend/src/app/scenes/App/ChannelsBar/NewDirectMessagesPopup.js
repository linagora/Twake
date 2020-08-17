import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelsService from 'services/channels/channels.js';
import MediumPopupComponent from 'services/mediumPopupManager/mediumPopupManager.js';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import UserListManager from 'components/UserListManager/UserListManager.js';

export default class NewDirectMessagesPopup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      newUserDiscussion: [],
    };
  }
  render() {
    return (
      <ObjectModal
        title={
          <ObjectModalTitle>
            {Languages.t('scenes.app.channelsbar.channelsuser.new_private_discussion')}
          </ObjectModalTitle>
        }
        onClose={() => MediumPopupComponent.closeAll()}
        noScrollBar={true}
        footer={
          <Button
            className="small primary"
            style={{ width: 'auto', float: 'right' }}
            disabled={this.state.newUserDiscussion.length === 0}
            onClick={() => {
              ChannelsService.openDiscussion(this.state.newUserDiscussion);
              MediumPopupComponent.closeAll();
            }}
          >
            {Languages.t('general.continue', [], 'Continue')}
          </Button>
        }
      >
        <UserListManager
          users={[]}
          canRemoveMyself
          noPlaceholder
          scope="all"
          autoFocus
          onUpdate={ids => {
            this.setState({ newUserDiscussion: ids });
          }}
        />
      </ObjectModal>
    );
  }
}
