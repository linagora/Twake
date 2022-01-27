import React, { Component } from 'react';

import UnconfiguredTab from './unconfigured-tab.js';
import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import Emojione from 'components/emojione/emojione';
import Loader from 'components/loader/loader.js';
import TasksService from 'app/deprecated/Apps/Tasks/Tasks.js';
import WorkspacesUsers from 'app/features/workspace-members/services/workspace-members-service';
import Workspaces from 'app/deprecated/workspaces/workspaces.js';
import UserService from 'app/features/users/services/current-user-service';
import Rounded from 'components/inputs/rounded.js';
import Menu from 'components/menus/menu.js';
import BoardEditor from './board/BoardEditor.js';
import MoreIcon from '@material-ui/icons/MoreHorizOutlined';
import AlertManager from 'app/features/global/services/alert-manager-service';
import { getCompanyApplications } from 'app/features/applications/state/company-applications';
import ConnectorsListManager from 'components/connectors-list-manager/connectors-list-manager.js';
import popupManager from 'app/deprecated/popupManager/popupManager.js';
import WorkspaceParameter from 'app/views/client/popup/WorkspaceParameter/WorkspaceParameter.js';
import Globals from 'app/features/global/services/globals-twake-app-service';
import WorkspaceUserRights from 'app/features/workspaces/services/workspace-user-rights-service';
import { getCompanyApplication as getApplication } from 'app/features/applications/state/company-applications';
import Groups from 'app/deprecated/workspaces/groups.js';

import Board from './board/Board.js';

import './tasks.scss';
import UserListManager from 'app/components/user-list-manager/user-list-manager';
import RouterService from 'app/features/router/services/router-service';

export default class Tasks extends Component {
  constructor(props) {
    super(props);
    this.props = props;

    this.state = {};

    Languages.addListener(this);
    TasksService.addListener(this);
    WorkspacesUsers.addListener(this);
    const { workspaceId, channelId } = RouterService.getStateFromRoute();
    if (workspaceId && channelId) {
      this.boards_collection_key = 'boards_' + workspaceId;

      Collections.get('boards').addListener(this);
      Collections.get('boards').addSource(
        {
          http_base_url: 'tasks/board',
          http_options: {
            channel_id: channelId,
            workspace_id: workspaceId,
          },
          websockets: [{ uri: 'boards/' + workspaceId, options: { type: 'board' } }],
        },
        this.boards_collection_key,
      );
    }
  }

  componentWillUnmount() {
    Languages.removeListener(this);
    TasksService.removeListener(this);
    WorkspacesUsers.removeListener(this);

    Collections.get('boards').removeSource(this.boards_collection_key);
  }

  getSortingValue(user_id) {
    var last_activity =
      (WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId)[user_id] || {})
        .last_access || 0;
    var val = (new Date().getTime() / 1000 - last_activity) / (60 * 60 * 12);
    return 0 - val;
  }

  render() {
    var current_board = null;
    if (((this.props.tab || {}).configuration || {}).board_id) {
      current_board = Collections.get('boards').find(this.props.tab.configuration.board_id);
    } else if (TasksService.current_board_by_workspace[Workspaces.currentWorkspaceId]) {
      if (
        TasksService.current_board_by_workspace[Workspaces.currentWorkspaceId].split('_')[0] ===
        'user'
      ) {
        var user_id =
          TasksService.current_board_by_workspace[Workspaces.currentWorkspaceId].split('_')[1];
        var user = Collections.get('users').find(user_id) || {};
        current_board = {
          id: TasksService.current_board_by_workspace[Workspaces.currentWorkspaceId],
          user_image: UserService.getThumbnail(user),
          title: UserService.getFullName(user),
        };
      } else {
        current_board = Collections.get('boards').find(
          TasksService.current_board_by_workspace[Workspaces.currentWorkspaceId],
        );
      }
    }

    var boards = Collections.get('boards').findBy({ workspace_id: Workspaces.currentWorkspaceId });
    var loading =
      !Collections.get('boards').did_load_first_time[this.boards_collection_key] &&
      boards.length === 0;

    if (
      this.props.tab != null &&
      (!this.props.tab.configuration || this.props.tab.configuration.board_id === undefined) &&
      !loading &&
      !current_board
    ) {
      return (
        <UnconfiguredTab
          saveTab={this.props.saveTab}
          channel={this.props.channel}
          tab={this.props.tab}
          collectionKey={this.boards_collection_key}
        />
      );
    }

    if (current_board && current_board.id) {
      Globals.window.location.hash = '#' + current_board.id;
    } else {
      Globals.window.location.hash = '#';
    }

    return (
      <>
        {loading && (
          <div className="loading">
            <Loader color="#CCC" className="app_loader" />
          </div>
        )}

        {!loading && !current_board && (
          <div className="tasks_app">
            <div className="board_selector">
              <div className="app_title">
                {Languages.t('scenes.apps.tasks.boards', [], 'Boards')}
              </div>

              <div className="app_subtitle">
                {Languages.t('components.workspace.list_manager.all', [], 'All')}
              </div>

              {boards.map(board => {
                return (
                  <div
                    className="board_frame fade_in"
                    onClick={() => {
                      TasksService.openBoard(board.id);
                    }}
                  >
                    <div className="board_name app_title">
                      {board.emoji && <Emojione type={board.emoji} s32 className="board_emoji" />}
                      {board.title}

                      {WorkspaceUserRights.hasWorkspacePrivilege() && (
                        <Menu
                          menu={[
                            {
                              text: Languages.t('general.edit', [], 'Edit'),
                              submenu_replace: true,
                              submenu: [
                                {
                                  type: 'title',
                                  text: Languages.t(
                                    'scenes.apps.tasks.new_board.edit_title',
                                    [],
                                    'Edit board',
                                  ),
                                },
                                {
                                  type: 'react-element',
                                  reactElement: level => {
                                    return (
                                      <BoardEditor
                                        menuLevel={level}
                                        id={board.id}
                                        collectionKey={this.boards_collection_key}
                                      />
                                    );
                                  },
                                },
                              ],
                            },
                            {
                              text: Languages.t('general.delete', [], 'Delete'),
                              className: 'error',
                              onClick: () => {
                                AlertManager.confirm(() => {
                                  Collections.get('boards').remove(
                                    board,
                                    this.boards_collection_key,
                                  );
                                });
                              },
                            },
                            { type: 'separator' },
                            {
                              type: 'menu',
                              text: Languages.t(
                                'scenes.apps.tasks.connectors_menu',
                                'Connecteurs...',
                              ),
                              submenu: [
                                {
                                  type: 'react-element',
                                  reactElement: level => {
                                    var apps = getCompanyApplications(Groups.currentGroupId).filter(
                                      app => false,
                                    );
                                    if (apps.length > 0) {
                                      return (
                                        <ConnectorsListManager
                                          list={apps}
                                          current={(board.connectors || [])
                                            .map(id => getApplication(id))
                                            .filter(item => item)}
                                          configurable={item =>
                                            ((item.display || {}).configuration || {})
                                              .can_configure_in_tasks
                                          }
                                          onChange={ids => {
                                            board.connectors = ids;
                                            Collections.get('boards').save(
                                              board,
                                              this.boards_collection_key,
                                            );
                                          }}
                                          onConfig={app => {
                                            this.configureCalendarConnector(app, board);
                                          }}
                                        />
                                      );
                                    }
                                    return (
                                      <div className="menu-text" style={{ margin: 0, padding: 0 }}>
                                        {Languages.t(
                                          'scenes.apps.tasks.no_connectors_menu_text',
                                          "Vous n'avez aucun connecteur capable de se connecter à un calendrier.",
                                        )}
                                      </div>
                                    );
                                  },
                                },
                                { type: 'separator' },
                                {
                                  type: 'menu',
                                  text: Languages.t(
                                    'scenes.apps.tasks.connectors_search_menu',
                                    'Chercher des connecteurs...',
                                  ),
                                  onClick: () => {
                                    popupManager.open(
                                      <WorkspaceParameter
                                        initial_page={3}
                                        options={'open_search_apps'}
                                      />,
                                      true,
                                      'workspace_parameters',
                                    );
                                  },
                                },
                              ],
                            },
                          ]}
                          className="options"
                        >
                          <MoreIcon className="m-icon-small" />
                        </Menu>
                      )}
                    </div>
                    <div className="board_info">
                      {board.active_tasks || '0'}{' '}
                      {Languages.t('scenes.apps.tasks.active_tasks', 'tâches actives')}
                    </div>
                  </div>
                );
              })}

              {WorkspaceUserRights.hasWorkspacePrivilege() && (
                <Menu
                  style={{ display: 'inline-block' }}
                  menu={[
                    {
                      type: 'title',
                      text: Languages.t('scenes.apps.tasks.new_board.title', 'New board'),
                    },
                    {
                      type: 'react-element',
                      reactElement: level => {
                        return (
                          <BoardEditor
                            menuLevel={level}
                            collectionKey={this.boards_collection_key}
                          />
                        );
                      },
                    },
                  ]}
                >
                  <Rounded className="board_add" />
                </Menu>
              )}
              <div
                className="app_title"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignContent: 'center',
                }}
              >
                {Languages.t('scenes.apps.tasks.my_tasks', 'Mes tâches')}

                <div
                  className="right-select-member"
                  style={{ marginTop: '-8px', minWidth: '200px' }}
                >
                  <UserListManager
                    users={[]}
                    buttonIcon={'enter'}
                    noPlaceholder
                    buttonText={Languages.t('scenes.apps.tasks.select_user_button')}
                    inputText={Languages.t('scenes.apps.tasks.select_user')}
                    scope="workspace"
                    onUpdate={ids => TasksService.openBoard('user_' + ids[0])}
                  />
                </div>
              </div>
              <Board
                tab={this.props.tab}
                noTitle
                hideMore
                inline
                channel={this.props.channel}
                mode={'list'}
                boardsCollectionKey={this.boards_collection_key}
                board={{ id: 'user_' + UserService.getCurrentUserId() }}
              />
            </div>
          </div>
        )}

        {current_board && (
          <div className="tasks_app">
            <Board
              tab={this.props.tab}
              key={current_board.id}
              channel={this.props.channel}
              mode={
                current_board.id.split('_')[0] === 'user'
                  ? 'list'
                  : current_board.view_mode || 'grid'
              }
              boardsCollectionKey={this.boards_collection_key}
              board={current_board}
            />
          </div>
        )}
      </>
    );
  }
}
