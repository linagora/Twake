<<<<<<< HEAD
import React, { Component } from 'react';

import { ObjectModalSectionTitle } from 'components/ObjectModal/ObjectModal.js';
=======
import React, {Component} from 'react';

import {ObjectModalSectionTitle} from 'components/ObjectModal/ObjectModal.js';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import UserListManager from 'components/UserListManager/UserListManager.js';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import Checkbox from 'components/Inputs/Checkbox.js';
import Select from 'components/Select/Select.js';
import Collections from 'services/Collections/Collections.js';
import Languages from 'services/languages/languages.js';

export default class EventsFilter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: props.options || {},
    };
  }

  render() {
    return (
      <div className="search_filters">
        {/*        <ObjectModalSectionTitle name="Chaînes de discussion" icon="building" /> */}

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('components.searchpopup.sender', [], 'Sender')}
          icon="user"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('components.searchpopup.sender', [], "Sender")} icon="user" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <UserListManager
          noPlaceholder
          canRemoveMyself
          scope="all"
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

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('components.searchpopup.mentions', [], 'Mentions')}
          icon="at"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('components.searchpopup.mentions', [], "Mentions")} icon="at" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <UserListManager
          noPlaceholder
          canRemoveMyself
          scope="all"
          users={this.state.options.mentions || []}
          onUpdate={value => {
            this.state.options.mentions = value;
            this.setState({});
          }}
        />

        {/*<ObjectModalSectionTitle name="Reactions" icon="thumbs-up" />*/}

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('components.searchpopup.creation', [], 'Création')}
          icon="calendar-alt"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('components.searchpopup.creation', [], "Création")} icon="calendar-alt" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('scenes.apps.messages.message.pinned', [], 'Pinned')}
          icon="map-pin"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('scenes.apps.messages.message.pinned', [], "Pinned")} icon="map-pin" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <Checkbox
          small
          value={this.state.options.pinned}
          onChange={value => {
            this.state.options.pinned = value;
            this.setState({});
          }}
<<<<<<< HEAD
          label={Languages.t('components.searchpopup.only_pinned', [], 'Only pinned messages')}
        />

        <ObjectModalSectionTitle
          name={Languages.t('scenes.apps.drive.navigators.new_file.create_file.type', [], 'Type')}
          icon="triangle"
        />
=======
          label={Languages.t('components.searchpopup.only_pinned', [], "Only pinned messages")}
        />

        <ObjectModalSectionTitle name={Languages.t('scenes.apps.drive.navigators.new_file.create_file.type', [], "Type")} icon="triangle" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <Select
          className="small"
          options={[
            {
              text: Languages.t('components.workspace.list_manager.all', [], 'Tous'),
              value: false,
            },
            {
<<<<<<< HEAD
              text: Languages.t(
                'scenes.apps.drive.navigators.navigator_content.files',
                [],
                'Fichiers'
              ),
=======
              text: Languages.t('scenes.apps.drive.navigators.navigator_content.files', [], 'Fichiers'),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              value:
                (Collections.get('applications').findBy({ simple_name: 'twake_drive' })[0] || {})
                  .id || 'error_no_drive_app_found',
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
<<<<<<< HEAD
          value={Languages.t('components.searchpopup.update_search', [], 'Update search')}
=======
          value={Languages.t('components.searchpopup.update_search', [], "Update search")}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        />
      </div>
    );
  }
}
