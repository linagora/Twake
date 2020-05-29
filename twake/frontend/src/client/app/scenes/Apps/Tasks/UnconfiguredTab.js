import React, { Component } from 'react';

import Collections from 'services/Collections/Collections.js';
import Languages from 'services/languages/languages.js';
import BoardPicker from './BoardPicker/BoardPicker.js';
import Menu from 'components/Menus/Menu.js';
import ChannelsService from 'services/channels/channels.js';
import Button from 'components/Buttons/Button.js';

export default class UnconfiguredTab extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  initInBoard(board) {
    if (!board.id) {
      Menu.closeAll();
      return;
    }
    ChannelsService.saveTab(
      this.props.channel.id,
      this.props.tab.app_id,
      undefined,
      { board_id: board.id },
      this.props.tab.id,
    );
    Menu.closeAll();
  }
  createFromChannel() {
    if (this.creating) {
      return;
    }
    this.creating = true;
    var board = Collections.get('boards').editCopy({});
    board.workspace_id = this.props.channel.original_workspace;
    board.title = this.props.channel.name;
    board.emoji = this.props.channel.icon;
    Collections.get('boards').save(board, this.props.collectionKey, board => {
      this.creating = false;
      this.initInBoard(board);
    });
  }
  render() {
    return (
      <div className="unconfigured_tab">
        <div className="title">{this.props.tab.name}</div>
        <div className="text" style={{ opacity: 0.5 }}>
          {Languages.t(
            'scenes.apps.tasks.unconfigured_tab',
            [],
            "Cet onglet n'est pas encore configuré.",
          )}
        </div>

        <br />

        <Button
          className="button medium right-margin"
          style={{ width: 'auto' }}
          onClick={() => this.createFromChannel()}
        >
          {Languages.t('scenes.apps.tasks.new_board.title', [], 'Nouveau board')}
        </Button>

        <Menu
          menu={[
            {
              type: 'react-element',
              reactElement: () => <BoardPicker onChoose={board => this.initInBoard(board)} />,
            },
          ]}
          style={{ display: 'inline-block' }}
        >
          <Button className="button medium secondary-light" style={{ width: 'auto' }}>
            {Languages.t('scenes.apps.tasks.choose_board_button', [], 'Choisir un board')}
          </Button>
        </Menu>
      </div>
    );
  }
}
