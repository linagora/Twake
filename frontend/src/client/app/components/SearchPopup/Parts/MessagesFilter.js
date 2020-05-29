import React, { Component } from 'react';

import { ObjectModalSectionTitle } from 'components/ObjectModal/ObjectModal.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import Checkbox from 'components/Inputs/Checkbox.js';
import Select from 'components/Select/Select.js';
import Collections from 'services/Collections/Collections.js';

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

        <ObjectModalSectionTitle name="Sender" icon="user" />
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

        <ObjectModalSectionTitle name="Mentions" icon="at" />
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

        <ObjectModalSectionTitle name="Création" icon="calendar-alt" />
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

        <ObjectModalSectionTitle name="Pinned" icon="map-pin" />
        <Checkbox
          small
          value={this.state.options.pinned}
          onChange={value => {
            this.state.options.pinned = value;
            this.setState({});
          }}
          label="Only pinned messages"
        />

        <ObjectModalSectionTitle name="Type" icon="triangle" />
        <Select
          className="small"
          options={[
            {
              text: 'Tous',
              value: false,
            },
            {
              text: 'Fichiers',
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
          value="Update search"
        />
      </div>
    );
  }
}
