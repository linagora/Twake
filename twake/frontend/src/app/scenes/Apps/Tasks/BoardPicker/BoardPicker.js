import React, { Component } from 'react';
import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import Workspaces from 'services/workspaces/workspaces.js';
import Emojione from 'components/Emojione/Emojione';
import Loader from 'components/Loader/Loader.js';

export default class BoardPicker extends React.Component {
  constructor() {
    super();
    this.state = {
      i18n: Languages,
    };
    Languages.addListener(this);

    this.boards_collection_key = 'boards_picker_' + Workspaces.getCurrentUserId;

    Collections.get('boards').addListener(this);
    Collections.get('boards').addSource(
      {
        http_base_url: 'tasks/board',
        http_options: {
          workspace_id: Workspaces.getCurrentUserId,
        },
        websockets: [{ uri: 'boards/' + Workspaces.getCurrentUserId, options: { type: 'board' } }],
      },
      this.boards_collection_key,
      () => {},
    );
  }
  componentWillUnmount() {
    Collections.get('boards').removeSource(this.boards_collection_key);
  }
  render() {
    var boards = Collections.get('boards').findBy({ workspace_id: Workspaces.currentWorkspaceId });
    var loading =
      !Collections.get('boards').did_load_first_time[this.boards_collection_key] &&
      boards.length == 0;

    return (
      <div className="boardPicker">
        {loading && (
          <div className="loading">
            <Loader color="#CCC" className="app_loader" />
          </div>
        )}

        {!loading &&
          boards.map(board => {
            return (
              <div
                className="board_frame fade_in"
                onClick={() => {
                  this.props.onChoose(board);
                }}
              >
                <div className="board_name app_title">
                  {board.emoji && <Emojione type={board.emoji} s32 className="board_emoji" />}
                  {board.title}
                </div>
                <div className="board_info">
                  {board.active_tasks || '0'}{' '}
                  {Languages.t('scenes.apps.tasks.active_tasks', [], 'tâches actives')}
                </div>
              </div>
            );
          })}
      </div>
    );
  }
}
