<<<<<<< HEAD
import React, { Component } from 'react';

import { ObjectModalSectionTitle } from 'components/ObjectModal/ObjectModal.js';
=======
import React, {Component} from 'react';

import {ObjectModalSectionTitle} from 'components/ObjectModal/ObjectModal.js';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import TagPicker from 'components/TagPicker/TagPicker.js';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import Input from 'components/Inputs/Input.js';
import WorkspaceListManager from 'components/WorkspaceListManager/WorkspaceListManager.js';
import Languages from 'services/languages/languages.js';

<<<<<<< HEAD
=======

>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
export default class FilesFilter extends React.Component {
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
          name={Languages.t(
            'scenes.apps.parameters.group_sections.apps.badge_extension',
            [],
            'Extension'
          )}
          icon="triangle"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('scenes.apps.parameters.group_sections.apps.badge_extension', [], "Extension")} icon="triangle" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <Input
          style={{ width: 160 }}
          className="medium"
          value={(this.state.options.type || {}).length ? this.state.options.type.join(',') : ''}
          placeholder={'png,jpeg'}
          onChange={evt => {
            var list = evt.target.value.split(',');
            this.state.options.type = [];
            list.forEach(item => {
              item = item.replace(/ /, '').toLocaleLowerCase();
              item = item.replace(/^\./, '');
              item = item.replace(/\.+/, '.');
              this.state.options.type.push(item);
            });
            if (list.length == 0 || (list.length == 1 && !list[0])) {
              this.state.options.type = false;
            }
            this.setState({});
          }}
        />

<<<<<<< HEAD
        <ObjectModalSectionTitle
          name={Languages.t('components.searchpopup.size', [], 'Taille')}
          icon="weight"
        />
=======
        <ObjectModalSectionTitle name={Languages.t('components.searchpopup.size', [], "Taille")} icon="weight" />
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <Input
          style={{ width: 80 }}
          className="medium"
          value={
            !this.state.options.size_gte || isNaN(parseInt(this.state.options.size_gte))
              ? ''
              : this.state.options.size_gte / 1000000
          }
          placeholder={'0'}
          onChange={evt => {
            if (evt.target.value) {
              this.state.options.size_gte = parseInt(evt.target.value);
              if (isNaN(this.state.options.size_gte)) {
                this.state.options.size_gte = false;
              } else {
                this.state.options.size_gte *= 1000000;
              }
            } else {
              this.state.options.size_gte = false;
            }
            this.setState({});
          }}
        />
        {' Mo - '}
        <Input
          style={{ width: 80 }}
          placeholder={'inf.'}
          className="medium"
          value={
            !this.state.options.size_lte || isNaN(parseInt(this.state.options.size_lte))
              ? ''
              : this.state.options.size_lte / 1000000
          }
          onChange={evt => {
            if (evt.target.value) {
              this.state.options.size_lte = parseInt(evt.target.value);
              if (isNaN(this.state.options.size_lte)) {
                this.state.options.size_lte = false;
              } else {
                this.state.options.size_lte *= 1000000;
              }
            } else {
              this.state.options.size_lte = false;
            }
            this.setState({});
          }}
        />
        {' Mo'}

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
          ts={this.state.options.date_create_after}
          onChange={value => {
            this.state.options.date_create_after = value;
            this.setState({});
          }}
        />
        {' - '}
        <DateSelectorInput
          withReset
          ts={this.state.options.date_create_before}
          onChange={value => {
            this.state.options.date_create_before = value;
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
