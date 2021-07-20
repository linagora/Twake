import React, { Component } from 'react';

import { ObjectModalFormTitle } from 'components/ObjectModal/DeprecatedObjectModal.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import UserListManager from 'components/UserListManager/UserListManager';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import WorkspaceListManager from 'components/WorkspaceListManager/WorkspaceListManager.js';
import Languages from 'services/languages/languages';

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
        <ObjectModalFormTitle
          name={Languages.t(
            'scenes.apps.parameters.group_sections.workspaces',
            [],
            'Espaces de travails',
          )}
          icon="building"
        />
        <WorkspaceListManager
          noPlaceholder
          showAddCurrentGroup
          showAddCurrentWorkspace
          addText={Languages.t(
            'components.searchpopup.filter_ws',
            [],
            'Filtrer les espaces de travail',
          )}
          workspaces={this.state.options.workspaces || []}
          onUpdate={value => {
            this.state.options.workspaces = value;
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.tags', [], 'Tags')}
          icon="label"
        />

        <TagPicker
          value={this.state.options.tags || []}
          onChange={values => {
            this.state.options.tags = values;
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.calendar.modals.part.participants', [], 'Participants')}
          icon="users-alt"
        />
        <UserListManager
          noPlaceholder
          canRemoveMyself
          scope="workspace"
          users={this.state.options.participants || []}
          onUpdate={value => {
            this.state.options.participants = value;
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('scenes.apps.calendar.event_edition.deadline_tag', [], 'Deadline')}
          icon="calendar-alt"
        />
        <DateSelectorInput
          withReset
          className=""
          ts={this.state.options.before_after}
          onChange={value => {
            this.state.options.before_after = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.before_before}
          onChange={value => {
            this.state.options.before_before = value;
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.creation', [], 'Création')}
          icon="calendar-alt"
        />
        <DateSelectorInput
          withReset
          className=""
          ts={this.state.options.date_created_after}
          onChange={value => {
            this.state.options.date_created_after = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.date_created_before}
          onChange={value => {
            this.state.options.date_created_before = value;
            this.setState({});
          }}
        />

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.last_modif', [], 'Dernière modification')}
          icon="calendar-alt"
        />
        <DateSelectorInput
          withReset
          className=""
          ts={this.state.options.date_modified_after}
          onChange={value => {
            this.state.options.date_modified_after = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.date_modified_before}
          onChange={value => {
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
          value={Languages.t('components.searchpopup.update_search', [], 'Update search')}
        />
      </div>
    );
  }
}
