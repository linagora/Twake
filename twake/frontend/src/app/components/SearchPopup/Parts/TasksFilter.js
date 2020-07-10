<<<<<<< HEAD
import React, { Component } from 'react';

import { ObjectModalSectionTitle } from 'components/ObjectModal/ObjectModal.js';
=======
import React, {Component} from 'react';

import {ObjectModalSectionTitle} from 'components/ObjectModal/ObjectModal.js';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import TagPicker from 'components/TagPicker/TagPicker.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import WorkspaceListManager from 'components/WorkspaceListManager/WorkspaceListManager.js';
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
<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t(
            'scenes.apps.parameters.group_sections.workspaces',
            [],
            'Espaces de travails'
          )}
          icon="building"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('scenes.apps.parameters.group_sections.workspaces', [], "Espaces de travails")} icon="building" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <WorkspaceListManager
          noPlaceholder
          showAddCurrentGroup
          showAddCurrentWorkspace
<<<<<<< HEAD
          addText={Languages.t(
            'components.searchpopup.filter_ws',
            [],
            'Filtrer les espaces de travail'
          )}
=======
          addText={Languages.t('components.searchpopup.filter_ws', [], 'Filtrer les espaces de travail')}
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          workspaces={this.state.options.workspaces || []}
          onUpdate={value => {
            this.state.options.workspaces = value;
            this.setState({});
          }}
        />

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('components.searchpopup.tags', [], 'Tags')}
          icon="label"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('components.searchpopup.tags', [], "Tags")} icon="label" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

        <TagPicker
          value={this.state.options.tags || []}
          onChange={values => {
            this.state.options.tags = values;
            this.setState({});
          }}
        />

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('scenes.apps.calendar.modals.part.participants', [], 'Participants')}
          icon="users-alt"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('scenes.apps.calendar.modals.part.participants', [], "Participants")} icon="users-alt" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('scenes.apps.calendar.event_edition.deadline_tag', [], 'Deadline')}
          icon="calendar-alt"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('scenes.apps.calendar.event_edition.deadline_tag', [], "Deadline")} icon="calendar-alt" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('components.searchpopup.last_modif', [], 'Dernière modification')}
          icon="calendar-alt"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('components.searchpopup.last_modif',[],"Dernière modification")} icon="calendar-alt" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
