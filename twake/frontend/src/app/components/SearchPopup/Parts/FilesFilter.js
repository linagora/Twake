import React, { Component } from 'react';

import { ObjectModalFormTitle } from 'components/ObjectModal/ObjectModal.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import Button from 'components/Buttons/Button.js';
import DateSelectorInput from 'components/Calendar/DatePicker.js';
import Input from 'components/Inputs/Input.js';
import WorkspaceListManager from 'components/WorkspaceListManager/WorkspaceListManager.js';
import Languages from 'services/languages/languages.js';

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
          name={Languages.t(
            'scenes.apps.parameters.group_sections.apps.badge_extension',
            [],
            'Extension',
          )}
          icon="triangle"
        />
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

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.size', [], 'Taille')}
          icon="weight"
        />
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

        <ObjectModalFormTitle
          name={Languages.t('components.searchpopup.creation', [], 'Création')}
          icon="calendar-alt"
        />
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
          value={Languages.t('components.searchpopup.update_search', [], 'Update search')}
        />
      </div>
    );
  }
}
