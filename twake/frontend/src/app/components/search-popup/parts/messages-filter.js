import React, { Component } from 'react';

import {
  ObjectModalFormTitle,
  ObjectModalSectionTitle,
} from 'components/object-modal/deprecated-object-modal.js';
import UserListManager from 'components/user-list-manager/user-list-manager';
import Button from 'components/buttons/button.js';
import DateSelectorInput from 'components/calendar/date-picker.js';
import Checkbox from 'components/inputs/checkbox.js';
import Select from 'components/select/select.js';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Languages from 'services/languages/languages';
import ChannelsService from 'app/deprecated/channels/channels.js';

export default class EventsFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: props.options || {},
    };
  }

  render() {
    const currentChannel =
      Collections.get('channels').findByFrontId(ChannelsService.currentChannelFrontId) || {};
    return (
      <div className="search_filters">
        {!currentChannel.app_id && (
          <div>
            <ObjectModalSectionTitle
              name={Languages.t('components.searchpopup.channel', [], 'Channel')}
              icon="list"
            />
            <Checkbox
              small
              value={this.state.options.channel_id}
              onChange={value => {
                this.state.options.channel_id = value ? [currentChannel.id] : null;
                this.setState({});
              }}
              label={Languages.t(
                'components.searchpopup.only_current_channel',
                [],
                'Only current channel',
              )}
            />
          </div>
        )}

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.sender', [], 'Sender')}
          icon="user"
        />
        <UserListManager
          noPlaceholder
          canRemoveMyself
          scope="workspace"
          users={this.state.options.sender ? [this.state.options.sender] : []}
          onUpdate={value => {
            if (value.length > 1) {
              this.state.options.sender = value[1] || undefined;
            } else {
              this.state.options.sender = value[0] || undefined;
            }
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.mentions', [], 'Mentions')}
          icon="at"
        />
        <UserListManager
          noPlaceholder
          canRemoveMyself
          scope="workspace"
          users={this.state.options.mentions || []}
          onUpdate={value => {
            this.state.options.mentions = value;
            this.setState({});
          }}
        />

        {/*<ObjectModalFormTitle name="Reactions" icon="thumbs-up" />*/}

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.creation', [], 'Création')}
          icon="calendar-alt"
        />
        <DateSelectorInput
          withReset
          className=""
          ts={this.state.options.date_after}
          onChange={value => {
            this.state.options.date_after = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.date_before}
          onChange={value => {
            this.state.options.date_before = value;
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.messages.message.pinned', [], 'Pinned')}
          icon="map-pin"
        />
        <Checkbox
          small
          value={this.state.options.pinned}
          onChange={value => {
            this.state.options.pinned = value;
            this.setState({});
          }}
          label={Languages.t('components.searchpopup.only_pinned', [], 'Only pinned messages')}
        />

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.drive.navigators.new_file.create_file.type', [], 'Type')}
          icon="triangle"
        />
        <Select
          className="small"
          options={[
            {
              text: Languages.t('components.workspace.list_manager.all', [], 'Tous'),
              value: false,
            },
            {
              text: Languages.t(
                'scenes.apps.drive.navigators.navigator_content.files',
                [],
                'Fichiers',
              ),
              value:
                (Collections.get('applications').findBy({ code: 'twake_drive' })[0] || {}).id ||
                'error_no_drive_app_found',
            },
          ]}
          value={this.state.options.application_id || false}
          onChange={v => {
            this.state.options.application_id = v;
            this.setState({});
          }}
        />

        <br />
        <br />
        <Button
          onClick={() => {
            this.props.onSearch(this.state.options || {});
          }}
          value={Languages.t('components.searchpopup.update_search', [], 'Update search')}
        />
      </div>
    );
  }
}
