import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Button from 'components/Buttons/Button.js';
import ChannelsService from 'services/channels/channels.js';
import ChannelTemplateEditor from 'app/scenes/Client/ChannelsBar/ChannelTemplateEditor.js';
import MediumPopupComponent from 'services/mediumPopupManager/mediumPopupManager.js';
import { ObjectModal, ObjectModalTitle } from 'components/ObjectModal/ObjectModal.js';
import Collections from 'app/services/Depreciated/Collections/Collections.js';

export default class ChannelWorkspaceEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      channel: [],
    };
  }
  newChannel = object => {
    this.setState({ channel: object });
  };
  updateChan() {
    Collections.get('channels').save(
      this.state.channel,
      'channels_' + this.state.channel.original_workspace,
      res => {
        ChannelsService.select(res);
      },
    );
    MediumPopupComponent.closeAll();
  }
  render() {
    return (
      <ObjectModal
        title={<ObjectModalTitle>{Languages.t(this.props.title)}</ObjectModalTitle>}
        onClose={() => MediumPopupComponent.closeAll()}
        noScrollBar={false}
        footer={
          <Button
            className="small primary"
            style={{ width: 'auto', float: 'right' }}
            disabled={!this.state.channel.name}
            onClick={() => {
              this.updateChan();
            }}
          >
            {Languages.t('general.continue', 'Continue')}
          </Button>
        }
      >
        <ChannelTemplateEditor
          channel={this.props.channel}
          newChannel={this.newChannel}
          disableButton
        />
      </ObjectModal>
    );
  }
}
