import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import Task from '../Task/Task.js';
import Icon from 'components/Icon/Icon.js';
import MenusManager from 'services/Menus/MenusManager.js';
import ListEditor from './ListEditor.js';
import TasksService from 'services/Apps/Tasks/Tasks.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Collections from 'services/Collections/Collections.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import AddTask from './AddTask.js';
import UserListManager from 'components/UserListManager/UserListManager.js';
import './List.scss';

import '../Task/Task.scss';

export default class List extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      i18n: Languages,
    };
    Languages.addListener(this);
    Collections.get('lists').addListener(this);
    Collections.get('tasks').addListener(this);
    Collections.get('lists').listenOnly(this, [props.list.front_id]);

    this.did_fade_in = false;
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('lists').removeListener(this);
    Collections.get('tasks').removeListener(this);
  }
  listOptions(evt) {
    var list = this.props.list;
    var menu = [];
    menu = [
      {
        text: Languages.t('general.edit'),
        submenu_replace: true,
        submenu: [
          {
            type: 'title',
            text: Languages.t('scenes.apps.tasks.list_modal.modify_list', [], 'Edit list'),
          },
          {
            type: 'react-element',
            reactElement: level => {
              return (
                <ListEditor
                  menuLevel={level}
                  id={list.id}
                  board={this.props.board}
                  collectionKey={this.props.collectionKey}
                />
              );
            },
          },
        ],
      },
    ];

    if (!WorkspaceUserRights.isInvite()) {
      if (WorkspaceUserRights.hasWorkspacePrivilege()) {
        menu.push(
          {
            text: Languages.t(
              'scenes.apps.tasks.list_modal.predefined_participants',
              [],
              'Participants prédéfinis...',
            ),
            submenu_replace: true,
            submenu: [
              {
                type: 'title',
                text: Languages.t(
                  'scenes.apps.tasks.list_modal.predefined_participants',
                  [],
                  'Participants prédéfinis',
                ),
              },
              {
                type: 'react-element',
                reactElement: () => {
                  return (
                    <div style={{ margin: '0px -8px' }}>
                      <UserListManager
                        users={(list.auto_participants || []).map(id => {
                          return { id: id };
                        })}
                        disableExterne={true}
                        scope="workspace"
                        onChange={ids => {
                          list.auto_participants = ids;
                          Collections.get('lists').save(list, this.props.collectionKey);
                          MenusManager.closeMenu();
                        }}
                        onCancel={() => {
                          MenusManager.closeMenu();
                        }}
                      />
                    </div>
                  );
                },
              },
            ],
          },

          /*{type: "separator"},
          {text: "Déplacer les tâches vers...", submenu: []},*/

          { type: 'separator' },
          {
            text: Languages.t(
              'scenes.apps.tasks.list_modal.archive_all_tasks',
              [],
              'Archiver toutes les tâches',
            ),
            hide: this.props.showArchived,
            onClick: () => {
              TasksService.archiveAllTasksInList(list, this.props.collectionKey);
            },
          },
          {
            text: Languages.t(
              'scenes.apps.tasks.list_modal.remove_archived_tasks',
              [TasksService.getTasksInList(list.board_id, list.id, true).length],
              'Supprimer les archivées ($1)',
            ),
            className: 'error',
            onClick: () => {
              TasksService.removeAllTasksInList(list, true, this.props.collectionKey);
            },
          },
          {
            text: Languages.t('scenes.apps.tasks.list_modal.remove'),
            hide: this.props.showArchived,
            className: 'error',
            onClick: () => {
              AlertManager.confirm(() => {
                Collections.get('lists').remove(list, this.props.collectionKey);
              });
            },
          },
        );
      }
    }
    var elementRect = window.getBoundingClientRect(this.options_dom);
    elementRect.x = elementRect.x || elementRect.left;
    elementRect.y = elementRect.y || elementRect.top;
    MenusManager.openMenu(menu, elementRect, 'right');
  }

  shouldComponentUpdate() {
    if (this.retry_update) clearTimeout(this.retry_update);
    if (TasksService.paused_notify[this.props.board.id]) {
      this.retry_update = setTimeout(() => {
        this.setState({});
      }, 1000);
      return false;
    }

    this.did_fade_in = true;
    return true;
  }

  newTask(task) {
    var list = Collections.get('tasks').editCopy({});
    list.title = task.title;
    list.archived = false;
    list.board_id = this.props.board.id;
    list.list_id = this.props.list.id;
    list.order = TasksService.newIndexAfter('tasks_' + this.props.list.id, -1);
    Collections.get('tasks').save(list, this.props.collectionKey);
  }

  render() {
    var list = this.props.list;

    var tasks = TasksService.getTasksInList(
      list.board_id,
      list.id,
      this.props.showArchived ? true : false,
    );
    TasksService.setElementIndexPool(
      'tasks_' + list.id,
      Collections.get('tasks').findBy({ board_id: this.props.board.id, list_id: list.id }),
    );

    return (
      <div className={'list ' + (this.did_fade_in ? '' : 'fade_in')}>
        <Draggable
          draggableId={'list_' + list.front_id}
          index={TasksService.getElementIndex(list, 'lists_' + list.board_id)}
          isDragDisabled={this.props.isDragDisabled}
        >
          {(provided, snapshot) => (
            <div
              className={'list_draggable_parent'}
              ref={provided.innerRef}
              {...provided.draggableProps}
            >
              <div
                className={'list_draggable noselect ' + (snapshot.isDragging ? 'isDragging ' : '')}
              >
                <div className="list_header noselect app_title" {...provided.dragHandleProps}>
                  <span className="list_title" style={{ color: list.color || '#AAA' }}>
                    <span
                      className="list_title_background"
                      style={{ backgroundColor: list.color || '#AAA' }}
                    />
                    {list.title || '-'}
                  </span>

                  <Icon
                    refDom={node => {
                      this.options_dom = node;
                    }}
                    className="options"
                    type="ellipsis-h"
                    onClick={evt => this.listOptions(evt)}
                  />
                </div>

                {this.props.canCreate && <AddTask onSubmit={task => this.newTask(task)} />}

                <Droppable
                  droppableId={list.front_id || 'noid_droppable'}
                  type="list"
                  key={list.front_id}
                >
                  {(provided, snapshot) => (
                    <div
                      className={'droppable ' + (snapshot.isDraggingOver ? 'isDraggingOver ' : '')}
                      style={{}}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div className="scrollable_task_list">
                        {(tasks || [])
                          .sort(
                            (a, b) =>
                              TasksService.getElementIndex(a, 'tasks_' + a.list_id) -
                              TasksService.getElementIndex(b, 'tasks_' + b.list_id),
                          )
                          .map((item, index) => (
                            <Task
                              isDragDisabled={this.props.isDragDisabled}
                              task={item}
                              board={this.props.board}
                              collectionKey={this.props.collectionKey}
                              list={list}
                            />
                          ))}

                        {(tasks || []).length == 0 && (
                          <span className="empty fade_in">
                            {this.state.i18n.t('scenes.apps.tasks.no_tasks')}
                          </span>
                        )}

                        {(tasks || []).length > 0 && provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          )}
        </Draggable>
      </div>
    );
  }
}
