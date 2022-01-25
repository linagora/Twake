import React, { Component } from 'react';
import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import MenuManager from 'app/components/menus/menus-manager.js';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';

import InputWithIcon from 'components/inputs/input-with-icon';
import Button from 'components/buttons/button.js';

export default class BoardEditor extends React.Component {
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
      var board = Collections.get('boards').find(this.props.id);
      if (board) {
        this.state.name = board.title;
        this.state.emoji = board.emoji;
      }
    }
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  save() {
    var board = {};
    if (this.props.id) {
      board = Collections.get('boards').find(this.props.id);
    } else {
      board = Collections.get('boards').editCopy({});
      board.workspace_id = Workspaces.currentWorkspaceId;
    }
    board.title = this.state.name;
    board.emoji = this.state.emoji;
    Collections.get('boards').save(board, this.props.collectionKey);
    MenuManager.closeMenu();
  }
  render() {
    return (
      <div>
        <div className="menu-buttons bottom-margin">
          <InputWithIcon
            className="full_width"
            focusOnDidMount
            menu_level={this.props.menuLevel}
            placeholder={Languages.t('scenes.apps.tasks.board.place_holder', [], 'Board name')}
            value={[this.state.emoji, this.state.name]}
            onEnter={() => this.save()}
            onChange={value => {
              this.setState({ emoji: value[0], name: value[1] });
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
