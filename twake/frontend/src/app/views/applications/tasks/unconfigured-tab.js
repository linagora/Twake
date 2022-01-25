import React, { Component } from 'react';

import Collections from 'app/services/Depreciated/Collections/Collections.js';
import Languages from 'services/languages/languages';
import BoardPicker from './board-picker/board-picker.js';
import Menu from 'components/menus/menu.js';
import ChannelsService from 'app/deprecated/channels/channels.js';
import Button from 'components/buttons/button.js';
import AccessRightsService from 'app/services/AccessRightsService';
import WorkspaceService from 'services/workspaces/workspaces';
import RouterService from 'services/RouterService';

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
    if (this.props.saveTab) this.props.saveTab({ board_id: board.id });
    Menu.closeAll();
  }
  createFromChannel() {
    if (this.creating) {
      return;
    }
    this.creating = true;
    var board = Collections.get('boards').editCopy({});
    board.workspace_id = RouterService.getStateFromRoute().workspaceId;
    board.title = this.props.channel.data.name;
    board.emoji = this.props.channel.data.icon;
    Collections.get('boards').save(board, this.props.collectionKey, board => {
      this.creating = false;
      this.initInBoard(board);
    });
  }
  render() {
    return (
      <div>
        <div className="unconfigured_tab">
          <div className="title">{this.props.tab.name}</div>
          <div className="text" style={{ opacity: 0.5 }}>
            {Languages.t(
              'scenes.apps.tasks.unconfigured_tab',
              [],
              "Cet onglet n'est pas encore configuré.",
            )}
          </div>

          {AccessRightsService.getCompanyLevel(WorkspaceService.currentGroupId) !== 'guest' && (
            <>
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
            </>
          )}
        </div>
      </div>
    );
  }
}
