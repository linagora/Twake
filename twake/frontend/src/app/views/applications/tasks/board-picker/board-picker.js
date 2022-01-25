import React, { Component } from 'react';
import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import Emojione from 'components/emojione/emojione';
import Loader from 'components/loader/loader.js';

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
    Languages.removeListener(this);
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
