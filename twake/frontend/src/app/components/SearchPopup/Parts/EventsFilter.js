import React, {Component} from 'react';

import {ObjectModalSectionTitle} from 'components/ObjectModal/ObjectModal.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import WorkspaceListManager from 'components/WorkspaceListManager/WorkspaceListManager.js';

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
        <ObjectModalSectionTitle name="Espaces de travails" icon="building" />
        <WorkspaceListManager
          noPlaceholder
          showAddCurrentGroup
          showAddCurrentWorkspace
          addText={'Filtrer les espaces de travail'}
          workspaces={this.state.options.workspaces || []}
          onUpdate={value => {
            this.state.options.workspaces = value;
            this.setState({});
          }}
        />

        <ObjectModalSectionTitle name="Tags" icon="label" />
        <TagPicker
          value={this.state.options.tags || []}
          onChange={values => {
            this.state.options.tags = values;
            this.setState({});
          }}
        />

        <ObjectModalSectionTitle name="Participants" icon="users-alt" />
        <UserListManager
          noPlaceholder
          canRemoveMyself
          scope="all"
          users={this.state.options.participants || []}
          onUpdate={value => {
            this.state.options.participants = value;
            this.setState({});
          }}
        />

        <ObjectModalSectionTitle name="Dates" icon="calendar-alt" />
        <DateSelectorInput
          withReset
          className=""
          ts={this.state.options.date_from}
          onChangeBlur={value => {
            this.state.options.date_from = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.date_to}
          onChangeBlur={value => {
            this.state.options.date_to = value;
            this.setState({});
          }}
        />

        <ObjectModalSectionTitle name="Dernière modification" icon="calendar-alt" />
        <DateSelectorInput
          withReset
          className=""
          ts={this.state.options.date_modified_after}
          onChangeBlur={value => {
            this.state.options.date_modified_after = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.date_modified_before}
          onChangeBlur={value => {
            this.state.options.date_modified_before = value;
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
