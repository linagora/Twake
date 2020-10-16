import React, { Component } from 'react';
import Languages from 'services/languages/languages.js';

import Collections from 'services/Collections/Collections.js';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import List from './List/List.js';
import PerfectScrollbar from 'react-perfect-scrollbar';
import Loader from 'components/Loader/Loader.js';
import './Board.scss';
import Emojione from 'components/Emojione/Emojione';
import Rounded from 'components/Inputs/Rounded.js';
import Menu from 'components/Menus/Menu.js';
import ListEditor from './List/ListEditor.js';
import TasksService from 'services/Apps/Tasks/Tasks.js';
import Tabs from 'components/Tabs/Tabs.js';
import Workspaces from 'services/workspaces/workspaces.js';
import ChevronDownIcon from '@material-ui/icons/KeyboardArrowDownOutlined';
import User from 'components/User/User.js';
import MenusManager from 'services/Menus/MenusManager.js';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      i18n: Languages,
      archived: false,
    };
    Languages.addListener(this);

    this.board_collection_key = 'board_' + this.props.board.id;

    this.user_mode = this.props.board.id.split('_')[0] == 'user';

    //Lists (only in board mode, not in user mode)
    if (!this.user_mode) {
      Collections.get('lists').addListener(this);
      Collections.get('lists').addSource(
        {
          http_base_url: 'tasks/list',
          http_options: {
            channel_id: this.props.channel.id,
            board_id: this.props.board.id,
          },
          websockets: [{ uri: 'board_lists/' + this.props.board.id, options: { type: 'list' } }],
        },
        this.board_collection_key,
      );
    }

    Collections.get('tasks').addListener(this);
    Collections.get('tasks').addSource(
      {
        http_base_url: 'tasks/task',
        http_options: {
          channel_id: this.props.channel.id,
          board_id: this.props.board.id,
        },
        websockets: [{ uri: 'board_tasks/' + this.props.board.id, options: { type: 'task' } }],
      },
      this.board_collection_key,
    );
  }
  componentWillUnmount() {
    Languages.removeListener(this);

    if (!this.user_mode) {
      Collections.get('lists').removeListener(this);
      Collections.get('lists').removeSource(this.board_collection_key);
    }

    Collections.get('tasks').removeListener(this);
    Collections.get('tasks').removeSource(this.board_collection_key);
  }

  shouldComponentUpdate() {
    if (this.retry_update) clearTimeout(this.retry_update);
    if (TasksService.paused_notify[this.props.board.id]) {
      this.retry_update = setTimeout(() => {
        this.setState({});
      }, 1000);
      return false;
    }
    return true;
  }

  onDragStart = event => {
    TasksService.paused_notify[this.props.board.id] = true;
  };

  onDragEnd = event => {
    TasksService.paused_notify[this.props.board.id] = false;

    if (!event.destination) {
      return;
    }

    if (event.type == 'board') {
      var element_front_id = event.draggableId.split('_')[1];
      var new_index = event.destination.index;
      var list = Collections.get('lists').findByFrontId(element_front_id);
      if (list) {
        Collections.get('lists').updateObject(
          {
            order: TasksService.newIndexAfter(
              'lists_' + this.props.board.id,
              new_index - (new_index < event.source.index ? 1 : 0),
            ),
          },
          list.front_id,
        );
        TasksService.setElementIndexPool(
          'lists_' + this.props.board.id,
          Collections.get('lists').findBy({ board_id: this.props.board.id }),
        );
        Collections.get('lists').save(list, this.board_collection_key);
      }
    }

    if (event.type == 'list') {
      var element_front_id = event.draggableId.split('_')[1];
      var source_list_front_id = event.source.droppableId;
      var destination_list_front_id = event.destination.droppableId;
      var destination_index = event.destination.index;

      var source_list = Collections.get('lists').findByFrontId(source_list_front_id);
      var list = Collections.get('lists').findByFrontId(destination_list_front_id);
      var task = Collections.get('tasks').findByFrontId(element_front_id);

      if (task && list && list.id) {
        Collections.get('tasks').updateObject(
          {
            list_id: list.id,
            order: TasksService.newIndexAfter(
              'tasks_' + list.id,
              destination_index -
                (destination_index < event.source.index ||
                destination_list_front_id != source_list_front_id
                  ? 1
                  : 0),
            ),
          },
          task.front_id,
        );
        if (source_list && source_list.id) {
          TasksService.setElementIndexPool(
            'tasks_' + source_list.id,
            Collections.get('tasks').findBy({
              board_id: this.props.board.id,
              list_id: source_list.id,
            }),
          );
        }
        TasksService.setElementIndexPool(
          'tasks_' + list.id,
          Collections.get('tasks').findBy({ board_id: this.props.board.id, list_id: list.id }),
        );
        Collections.get('tasks').save(task, this.board_collection_key);
      }
    }
  };

  render() {
    var current_board = this.props.board;

    this.isDragDisabled = false;

    var lists = Collections.get('lists').findBy({ board_id: this.props.board.id });
    if (this.user_mode) {
      lists = [
        {
          id: 'allusertasks_' + this.props.board.id.split('_')[1],
          title: Languages.t('components.workspace.list_manager.all', [], 'All'),
          all: true,
        },
      ];

      var workspaces = [];
      TasksService.getTasksInList(
        this.props.board.id,
        lists[0].id,
        this.state.archived ? true : false,
      ).forEach(task => {
        if (workspaces.indexOf(task.workspace_id) < 0) {
          workspaces.push(task.workspace_id);

          var workspace = Collections.get('workspaces').find(task.workspace_id);

          if (workspace) {
            var group = workspace.group;

            lists.push({
              id:
                'workspaceusertasks_' + this.props.board.id.split('_')[1] + '_' + task.workspace_id,
              title:
                (group.id != Workspaces.currentGroupId ? group.name + ' • ' : '') + workspace.name,
              other_group: true,
            });
          }
        }
      });

      lists.sort((a, b) => {
        if (a.all) {
          return -1;
        }
        if (a.other_group) {
          return 1;
        }
        if (b.other_group) {
          return -1;
        }
        return 0;
      });

      this.isDragDisabled = true;
    }

    var loading =
      (!this.user_mode &&
        !Collections.get('lists').did_load_first_time[this.board_collection_key]) ||
      !Collections.get('tasks').did_load_first_time[this.board_collection_key];

    if (loading) {
      return (
        <div className="loading">
          <Loader color="#CCC" className="app_loader" />
        </div>
      );
    }

    TasksService.setElementIndexPool(
      'lists_' + this.props.board.id,
      Collections.get('lists').findBy({ board_id: this.props.board.id }),
    );

    var lists = lists.sort(
      (a, b) =>
        TasksService.getElementIndex(a, 'lists_' + a.board_id) -
        TasksService.getElementIndex(b, 'lists_' + b.board_id),
    );
    if (!this.user_mode) {
      lists.push({
        id: 'add_list',
        render: (
          <div
            style={{
              display: 'inline-block',
              paddingRight: '40px',
              position: 'relative',
              top: '-8px',
            }}
          >
            <Menu
              style={{ display: 'inline-block' }}
              menu={[
                {
                  type: 'title',
                  text: Languages.t('scenes.apps.tasks.list_modal.new_list', [], 'New list'),
                },
                {
                  type: 'react-element',
                  reactElement: level => {
                    return (
                      <ListEditor
                        menuLevel={level}
                        board={this.props.board}
                        collectionKey={this.board_collection_key}
                      />
                    );
                  },
                },
              ]}
            >
              <Rounded
                text={Languages.t('scenes.apps.tasks.list_modal.new_list', [], 'New list')}
                className="list_add"
              />
            </Menu>
          </div>
        ),
      });
    }

    return (
      <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
        <div className="board_header">
          {!this.props.noTitle && (
            <div className="app_title">
              {!((this.props.tab || {}).configuration || {}).board_id && (
                <div
                  className="app_back_btn"
                  onClick={() => {
                    TasksService.openBoard(null);
                  }}
                >
                  {Languages.t('scenes.apps.board.all_boards', [], 'All Boards')}
                </div>
              )}
              {current_board.emoji && (
                <Emojione type={current_board.emoji} s32 className="board_emoji" />
              )}
              {current_board.user_image && (
                <User user={{ thumbnail: current_board.user_image }} medium />
              )}
              {current_board.title}
            </div>
          )}

          <div className="nomobile info" />

          {!this.props.hideMore && (
            <div
              className="nomobile options app_right_btn"
              onClick={evt => {
                MenusManager.openMenu(
                  [
                    {
                      type: 'title',
                      text: Languages.t('scenes.apps.board.display_as', [], 'Afficher en tant que'),
                    },
                    {
                      type: 'menu',
                      icon: current_board.view_mode == 'grid' ? 'check' : ' ',
                      className: current_board.view_mode == 'grid' ? 'primary' : ' ',
                      rightIcon: 'window-restore',
                      text: Languages.t('scenes.apps.board.kanban', [], 'Kanban'),
                      onClick: () => {
                        current_board.view_mode = 'grid';
                        Collections.get('boards').save(
                          current_board,
                          this.props.boardsCollectionKey,
                        );
                      },
                    },
                    {
                      type: 'menu',
                      icon: current_board.view_mode == 'list' ? 'check' : ' ',
                      className: current_board.view_mode == 'list' ? 'primary' : ' ',
                      rightIcon: 'list-ul',
                      text: Languages.t('scenes.apps.calendar.calendar.list_btn', [], 'Liste'),
                      onClick: () => {
                        current_board.view_mode = 'list';
                        Collections.get('boards').save(
                          current_board,
                          this.props.boardsCollectionKey,
                        );
                      },
                    },

                    { type: 'separator' },
                    {
                      type: 'menu',
                      icon: this.state.archived == false ? 'check' : ' ',
                      className: this.state.archived == false ? 'primary' : ' ',
                      text: Languages.t('scenes.apps.board.active_tasks', [], 'Tâches actives'),
                      onClick: () => {
                        this.setState({ archived: false });
                      },
                    },
                    {
                      type: 'menu',
                      icon: this.state.archived ? 'check' : ' ',
                      className: this.state.archived ? 'primary' : ' ',
                      text: Languages.t(
                        'scenes.apps.board.archived_tasks',
                        [
                          Collections.get('tasks').findBy({
                            archived: true,
                            board_id: current_board.id,
                          }).length,
                        ],
                        'Tâches archivées ($1)',
                      ),
                      onClick: () => {
                        this.setState({ archived: true });
                      },
                    },
                  ],
                  { x: evt.clientX, y: evt.clientY },
                  'bottom',
                );
              }}
            >
              {Languages.t('general.more', [], 'Plus')}
              <ChevronDownIcon className="m-icon-small" />
            </div>
          )}
        </div>

        <div
          className={
            'board ' +
            (this.props.inline ? 'inline ' : '') +
            (this.props.mode == 'list' ? 'mode_list ' : 'mode_grid ')
          }
        >
          <div className="lists_before">
            {this.props.mode == 'list' && (
              <Tabs
                tabs={lists
                  .map((item, index) => {
                    return {
                      id: item.front_id || item.id,
                      titleClassName: item.id == 'add_list' ? 'no-selection-border' : '',
                      titleStyle: { borderBottomColor: item.color },
                      title: () => {
                        if (item.id == 'add_list') {
                          return item.render;
                        }
                        return (
                          (item.title || '-') +
                          ' (' +
                          TasksService.getTasksInList(
                            item.board_id,
                            item.id,
                            this.state.archived ? true : false,
                          ).length +
                          ')'
                        );
                      },
                      render: () => {
                        if (item.id == 'add_list') {
                          return '';
                        }
                        return (
                          <List
                            showArchived={this.state.archived}
                            isDragDisabled={this.isDragDisabled}
                            canCreate={!this.user_mode}
                            list={item}
                            board={this.props.board}
                            collectionKey={this.board_collection_key}
                            key={item.front_id}
                          />
                        );
                      },
                    };
                  })
                  .reduce((acc, cur, i) => {
                    acc[cur.id] = cur;
                    return acc;
                  }, {})}
              />
            )}

            {this.props.mode == 'grid' && (
              <PerfectScrollbar className="lists_scrollable">
                <Droppable
                  droppableId={'lists'}
                  direction="horizontal"
                  type="board"
                  className="droppable_list"
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        display: 'flex',
                        minWidth: 100 + 280 * (lists.length - 1),
                        height: '100%',
                      }}
                    >
                      {lists
                        .filter(a => a.id != 'add_list')
                        .map((item, index) => {
                          return (
                            <List
                              showArchived={this.state.archived}
                              isDragDisabled={this.isDragDisabled}
                              canCreate={!this.user_mode}
                              list={item}
                              board={this.props.board}
                              collectionKey={this.board_collection_key}
                              key={item.front_id}
                            />
                          );
                        })}

                      {provided.placeholder}

                      {lists[lists.length - 1].render}
                    </div>
                  )}
                </Droppable>
              </PerfectScrollbar>
            )}
          </div>
        </div>

        {/*<MainPlus onClick={()=>{
          MediumPopupManager.open(<TaskEditor collectionKey={this.board_collection_key} />, {size: {width: 600}});
        }} />*/}
      </DragDropContext>
    );
  }
}
