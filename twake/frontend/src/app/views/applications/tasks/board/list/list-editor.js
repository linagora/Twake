import React, { Component } from 'react';
import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import MenuManager from 'app/components/menus/menus-manager.js';

import InputWithColor from 'components/inputs/input-with-color.js';
import Button from 'components/buttons/button.js';
import TasksService from 'app/deprecated/Apps/Tasks/Tasks.js';

export default class ListEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      i18n: Languages,
      name: '',
      emoji: '',
    };
    Languages.addListener(this);
  }
  componentWillMount() {
    if (this.props.id) {
      var list = Collections.get('lists').find(this.props.id);
      if (list) {
        this.state.name = list.title;
        this.state.color = list.color;
      }
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  save() {
    var list = {};
    if (this.props.id) {
      list = Collections.get('lists').find(this.props.id);
    } else {
      list = Collections.get('lists').editCopy({});
      list.board_id = this.props.board.id;
      list.order = TasksService.newIndexAfter('lists_' + this.props.board.id);
    }
    list.title = this.state.name;
    list.color = this.state.color;
    Collections.get('lists').save(list, this.props.collectionKey);
    MenuManager.closeMenu();
  }
  render() {
    return (
      <div>
        <div className="menu-buttons bottom-margin">
          <InputWithColor
            className="full_width"
            focusOnDidMount
            menu_level={this.props.menuLevel}
            placeholder={Languages.t('scenes.apps.tasks.board.list_name', [], 'List name')}
            value={[this.state.color, this.state.name]}
            onEnter={() => this.save()}
            onChange={value => {
              this.setState({ color: value[0], name: value[1] });
            }}
          />
        </div>
        <div className="menu-buttons">
          <Button
            disabled={(this.state.name || '').length <= 0}
            type="button"
            value={Languages.t('general.save', [], 'Enregistrer')}
            onClick={() => {
              this.save();
            }}
          />
        </div>
      </div>
    );
  }
}
