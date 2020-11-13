import React, { Component, useState } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import Icon from 'components/Icon/Icon.js';
import Loader from 'components/Loader/Loader.js';
import UploadZone from 'components/Uploads/UploadZone.js';

import Numbers from 'services/utils/Numbers.js';
import FilePicker from 'components/Drive/FilePicker/FilePicker.js';
import './Drive.scss';
import DriveMultiSelector from 'components/Drive/DriveMultiSelector.js';
import Menu from 'components/Menus/Menu.js';
import MenusManager from 'services/Menus/MenusManager.js';
import Workspaces from 'services/workspaces/workspaces.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';

import ChevronRightIcon from '@material-ui/icons/ChevronRightOutlined';
import ChevronDownIcon from '@material-ui/icons/KeyboardArrowDownOutlined';

import DriveService from 'services/Apps/Drive/Drive.js';
import SelectionsManager from 'services/SelectionsManager/SelectionsManager.js';

import PathElement from './PathElement.js';
import AlertManager from 'services/AlertManager/AlertManager.js';

import UnconfiguredTab from './UnconfiguredTab.js';
import Viewer from './Viewer/Viewer.js';

import MainPlus from 'components/MainPlus/MainPlus.js';
import Globals from 'services/Globals.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';

import DriveList from './Lists/List.js';
import PerfectScrollbar from 'react-perfect-scrollbar';

import { NewFolderInput, NewLinkInput, NewFileInput } from './DriveEditors';

export default class Drive extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
      drive_repository: Collections.get('drive'),
      app_drive_service: DriveService,
      workspaces: Workspaces,
      selections_manager: SelectionsManager,
    };

    Languages.addListener(this);
    Collections.get('drive').addListener(this);
    Workspaces.addListener(this);
    DriveService.addListener(this);
    SelectionsManager.addListener(this);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('drive').removeListener(this);
    Workspaces.removeListener(this);
    DriveService.removeListener(this);
    SelectionsManager.removeListener(this);

    if (this.drive_channel) {
      console.log('unmount drive remove source');
      Collections.get('drive').removeSource(
        this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
      );
    }
  }
  componentWillMount() {
    this.drive_channel =
      (this.props.channel || {}).id +
      '_' +
      (this.props.tab || {}).id +
      '_' +
      Workspaces.currentWorkspaceId;

    var currentdir = this.state.app_drive_service.current_directory_channels[this.drive_channel];
    if (currentdir && !currentdir.id) {
      currentdir = false;
    }
    this.state.app_drive_service.current_directory_channels[this.drive_channel] =
      currentdir || this.props.directory || {};

    console.log(this.state.app_drive_service.current_directory_channels[this.drive_channel]);

    this.did_mount = false;
    this.onUpdate(this.props, this.state);

    this.init();
  }
  componentWillUpdate(nextProps, nextState) {
    this.onUpdate(nextProps, nextState);
  }
  componentDidMount() {
    DriveService.addSourceIfNotExist(Workspaces.currentWorkspaceId, this.drive_channel);
  }
  init() {
    if (this.props.tab != null && this.props.tab.configuration.directory_id === undefined) {
      return;
    }

    var directory_id =
      (DriveService.current_directory_channels[this.drive_channel] || {}).id ||
      ((this.props.tab || {}).configuration || {}).directory_id ||
      '';

    if ((Globals.store_public_access_get_data || {}).public_access_token) {
      DriveService.public_access_token = (
        Globals.store_public_access_get_data || {}
      ).public_access_token;
      Workspaces.currentWorkspaceId = (Globals.store_public_access_get_data || {}).workspace_id;
      this.init_directory = (Globals.store_public_access_get_data || {}).element_id;
      directory_id = this.init_directory;
    }

    if ((DriveService.current_directory_channels[this.drive_channel] || {}).id != directory_id) {
      this.changeCurrentDirectory({ id: directory_id });
      DriveService.current_directory_channels[this.drive_channel] = { id: directory_id };
    }
  }
  onUpdate(nextProps, nextState) {
    if (this.props.tab && this.init_directory != this.props.tab.configuration.directory_id) {
      this.init_directory = this.props.tab.configuration.directory_id;
      this.changeCurrentDirectory({ id: this.init_directory });
      return;
    }

    if (this.props.tab != null && this.props.tab.configuration.directory_id === undefined) {
      return;
    }

    if (
      (DriveService.current_directory_channels[this.drive_channel] || {}).id !=
      this.old_directory_id
    ) {
      this.old_directory_id = (
        DriveService.current_directory_channels[this.drive_channel] || {}
      ).id;

      Menu.closeAll();
      SelectionsManager.unselectAll();
    }
  }
  buildPath() {
    var in_trash = !!DriveService.is_in_trash_channels[this.drive_channel];

    var workspace = Collections.get('workspaces').find(this.state.workspaces.currentWorkspaceId);
    var group = null;
    if (workspace) {
      group = Collections.get('groups').find(workspace.group.id);
    }

    DriveService.addPathForElement(
      this.state.app_drive_service.current_directory_channels[this.drive_channel],
    );

    var path = JSON.parse(
      JSON.stringify(
        this.state.app_drive_service.current_directory_channels[this.drive_channel].path || [],
      ),
    );

    if (!path || path.length == 0) {
      path.push(this.state.app_drive_service.current_directory_channels[this.drive_channel]);
    }

    /*path.unshift({
      id: "group_root",
      name: group.name
    });*/

    var i = 0;
    var did_pass_init_dir = false;
    return path
      .filter(dir => {
        if (this.init_directory) {
          if (dir.id == this.init_directory) {
            did_pass_init_dir = true;
          }
          return did_pass_init_dir;
        } else {
          return true;
        }
      })
      .map(directory => {
        i++;
        var list = [];
        if (i > 1) {
          list.push(<ChevronRightIcon className="m-icon-small" />);
        }
        list.push(
          <PathElement
            parent={this}
            data={directory}
            showOptions={i == path.length}
            workspace={workspace}
            inTrash={in_trash}
            driveCollectionKey={
              this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
            }
            channel={this.drive_channel}
          />,
        );
        return list;
      });
  }
  createFolder(new_directory_name) {
    if (!(new_directory_name || '').trim()) {
      return;
    }
    Menu.closeAll();
    DriveService.createDirectory(
      this.state.workspaces.currentWorkspaceId,
      new_directory_name,
      this.state.app_drive_service.current_directory_channels[this.drive_channel],
      this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
    );
  }

  changeCurrentDirectory(directory) {
    if (this.props.tab != null && this.props.tab.configuration.directory_id === undefined) {
      return;
    }
    DriveService.changeCurrentDirectory(this.drive_channel, directory);
  }

  createFile(info, new_file_name) {
    var url = info.url;
    new_file_name = new_file_name + '.' + info.filename.replace(/^.*\./, '');
    var name = new_file_name || info.filename;
    DriveService.createFile(
      this.state.workspaces.currentWorkspaceId,
      name,
      DriveService.current_directory_channels[this.drive_channel],
      { download_content_from_url: url },
      DriveService.current_collection_key_channels[this.drive_channel],
    );
    MenusManager.closeMenu();
  }

  createLinkFile(new_file_name, new_file_link) {
    var name = (new_file_name || 'Untitled') + '.url';
    var url = new_file_link || '';
    if (!url) {
      return;
    }
    new_file_name = undefined;
    new_file_link = undefined;
    DriveService.createFile(
      this.state.workspaces.currentWorkspaceId,
      name,
      DriveService.current_directory_channels[this.drive_channel],
      { url: url },
      DriveService.current_collection_key_channels[this.drive_channel],
    );
    MenusManager.closeMenu();
  }

  render() {
    var current_selection =
      this.state.selections_manager.selected_per_type[
        this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
      ] || {};

    if (this.props.tab != null && this.props.tab.configuration.directory_id === undefined) {
      return (
        <UnconfiguredTab
          channel={this.props.channel}
          tab={this.props.tab}
          onFinish={() => {
            this.componentWillMount();
            this.setState({});
          }}
        />
      );
    }

    if (this.props.tab && this.props.tab.configuration && this.props.tab.configuration.file_id) {
      var element = Collections.get('drive').find(this.props.tab.configuration.file_id);
      if (element) {
        return (
          <div style={{ flex: 1, position: 'relative' }}>
            <Viewer inline disableHeader document={element} />
          </div>
        );
      }
    }

    var list = [];

    //Add delay to make everything look more fast (loading all message add delay)
    if (!this.did_mount) {
      setTimeout(() => {
        this.did_mount = true;
        this.setState({});
      }, 10);
    }

    var in_trash = !!DriveService.is_in_trash_channels[this.drive_channel];

    var workspace_id = this.state.workspaces.currentWorkspaceId;
    var directory =
      this.state.app_drive_service.current_directory_channels[this.drive_channel] || {};

    directory = Collections.get('drive').find(directory.id) || directory;

    var directory_id = directory.id;

    if (directory_id) {
      Globals.window.location.hash = '#' + directory_id;
    }

    if (!directory_id) {
      return list;
    }

    var trash_filter = undefined;
    if (!directory.parent_id) {
      trash_filter = in_trash;
    }

    var filter_dir = { workspace_id: workspace_id, parent_id: directory_id, is_directory: true };
    if (trash_filter !== undefined) filter_dir.trash = trash_filter;
    var directories = this.state.drive_repository
      .findBy(filter_dir)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    var filter_files = { workspace_id: workspace_id, parent_id: directory_id, is_directory: false };
    if (trash_filter !== undefined) filter_files.trash = trash_filter;
    var files = this.state.drive_repository
      .findBy(filter_files)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (directory.id && !directory.is_directory) {
      files.push(directory);
    }

    var externalStorageMenu = [];
    WorkspacesApps.getApps()
      .filter(app => ((app.display || {}).drive_module || {}).can_connect_to_directory)
      .map(app => {
        externalStorageMenu.push({
          type: 'menu',
          text: app.name,
          emoji: app.icon_url,
          onClick: () => {
            DriveService.createDirectory(
              this.state.workspaces.currentWorkspaceId,
              app.name,
              DriveService.current_directory_channels[this.drive_channel],
              this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
              file => {
                var data = {
                  drive_element: file,
                };
                WorkspacesApps.notifyApp(file.application_id, 'configuration', 'drive', data);
              },
              { application_id: app.id, external_storage: true },
            );
          },
        });
      });
    if (externalStorageMenu.length == 0) {
      externalStorageMenu.push({
        type: 'text',
        text: Languages.t(
          'scenes.apps.drive.no_storage_app_alert',
          [],
          "Vous n'avez aucune application vous permettant de créer un fichier.",
        ),
      });
    }

    var addableFilesMenu = [];
    WorkspacesApps.getApps()
      .filter(app => ((app.display || {}).drive_module || {}).can_create_files)
      .map(app => {
        app.display.drive_module.can_create_files.map(info => {
          addableFilesMenu.push({
            type: 'menu',
            emoji: info.icon || app.icon_url,
            text: info.name + ' (' + app.name + ')',
            submenu_replace: true,
            submenu: [
              {
                type: 'title',
                text: Languages.t('scenes.apps.drive.new_file_title', [], 'Nouveau fichier'),
              },
              {
                type: 'react-element',
                reactElement: () => {
                  return (
                    <NewFileInput
                      value={info.filename.replace(/\.[^.]*$/, '')}
                      createFile={name => this.createFile(info, name)}
                    />
                  );
                },
              },
            ],
          });
        });
      });

    addableFilesMenu.push({
      type: 'menu',
      icon: 'link-alt',
      text: Languages.t('scenes.apps.drive.new_link_title', [], 'New link'),
      submenu_replace: true,
      submenu: [
        {
          type: 'title',
          text: Languages.t('scenes.apps.drive.new_link_title', [], 'New link'),
        },
        {
          type: 'react-element',
          reactElement: () => {
            return <NewLinkInput createLinkFile={(a, b) => this.createLinkFile(a, b)} />;
          },
        },
      ],
    });

    if (addableFilesMenu.length == 0) {
      addableFilesMenu.push({
        type: 'text',
        text: Languages.t(
          'scenes.apps.drive.no_file_alert',
          [],
          "Vous n'avez aucune application vous permettant de créer un fichier.",
        ),
      });
    }

    var selection_length = Object.keys(
      SelectionsManager.selected_per_type[
        this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
      ] || {},
    ).length;
    var general_menu = [];

    if (!WorkspaceUserRights.isNotConnected() && !WorkspaceUserRights.isInvite()) {
      general_menu.push({
        type: 'menu',
        text: in_trash
          ? Languages.t('scenes.apps.drive.go_out_trash_menu', [], 'Sortir de la corbeille')
          : Languages.t('scenes.apps.drive.go_trash_menu', [], 'Accéder à la corbeille'),
        onClick: () => {
          DriveService.toggleInTrash(this.drive_channel);
        },
      });
    }

    if (selection_length > 0 && !WorkspaceUserRights.isNotConnected()) {
      if (!in_trash) {
        general_menu = general_menu.concat([
          {
            type: 'menu',
            text: Languages.t('scenes.apps.drive.download_button', [], 'Télécharger'),
            onClick: () => {
              var elements = [];
              Object.keys(
                SelectionsManager.selected_per_type[
                  this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
                ] || {},
              ).forEach(item => {
                var el = Collections.get('drive').find(item);
                if (el) {
                  elements.push(el);
                }
              });
              if (elements.length > 0) {
                var link = DriveService.getLink(elements, undefined, 1);
                window.open(link);
              }
            },
          },
          {
            type: 'menu',
            text: Languages.t('scenes.apps.drive.move_text', [], 'Déplacer'),
            submenu: [
              {
                type: 'react-element',
                reactElement: () => (
                  <FilePicker
                    mode={'select_location'}
                    initialDirectory={
                      this.state.app_drive_service.current_directory_channels[this.drive_channel]
                    }
                    onChoose={new_parent =>
                      DriveService.moveFile(
                        Object.keys(
                          SelectionsManager.selected_per_type[
                            this.state.app_drive_service.current_collection_key_channels[
                              this.drive_channel
                            ]
                          ] || {},
                        ),
                        new_parent,
                      )
                    }
                  />
                ),
              },
            ],
            onClick: () => {},
          },
        ]);

        general_menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.drive.throw_menu', [], 'Mettre à la corbeille'),
          className: 'error',
          onClick: () => {
            var elements = Object.keys(
              SelectionsManager.selected_per_type[
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
              ] || {},
            ).map(id => Collections.get('drive').find(id));
            if (elements.length > 0) {
              DriveService.remove(
                elements,
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
              );
              SelectionsManager.unselectAll(
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
              );
            }
          },
        });
      } else {
        general_menu.push({
          type: 'menu',
          text: Languages.t('scenes.apps.drive.restore_menu', [], 'Restaurer'),
          onClick: () => {
            var elements = Object.keys(
              SelectionsManager.selected_per_type[
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
              ] || {},
            ).map(id => Collections.get('drive').find(id));
            if (elements.length > 0) {
              DriveService.restore(
                elements,
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
              );
              SelectionsManager.unselectAll(
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
              );
            }
          },
        });

        general_menu.push({
          type: 'menu',
          text: Languages.t(
            'scenes.apps.drive.remove_definitely_menu',
            [],
            'Supprimer définitivement',
          ),
          className: 'error',
          onClick: () => {
            AlertManager.confirm(() => {
              var elements = Object.keys(
                SelectionsManager.selected_per_type[
                  this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
                ] || {},
              ).map(id => Collections.get('drive').find(id));
              if (elements.length > 0) {
                DriveService.removeDefinitively(
                  elements,
                  this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
                );
                SelectionsManager.unselectAll(
                  this.state.app_drive_service.current_collection_key_channels[this.drive_channel],
                );
              }
            });
          },
        });
      }
    }

    var plus_menu = [
      {
        type: 'menu',
        text: Languages.t(
          'scenes.apps.drive.import_from_computer_menu',
          [],
          "Importer depuis l'ordinateur",
        ),
        icon: 'desktop',
        onClick: () => {
          if (this.upload_zone) {
            this.upload_zone.open();
          }
        },
      },
      {
        type: 'menu',
        text: Languages.t('scenes.apps.drive.new_file_menu', [], 'Nouveau fichier'),
        icon: 'file',
        submenu: addableFilesMenu,
      },
      {
        type: 'menu',
        text: Languages.t('scenes.apps.drive.new_folder_title', [], 'Nouveau dossier'),
        icon: 'folder',
        submenu_replace: true,
        submenu: [
          {
            type: 'title',
            text: Languages.t('scenes.apps.drive.new_folder_title', [], 'Nouveau dossier'),
          },
          {
            type: 'react-element',
            reactElement: () => {
              return (
                <NewFolderInput
                  value={''}
                  createFolder={name => {
                    this.createFolder(name);
                  }}
                />
              );
            },
          },
        ],
      },
    ];

    if (
      !DriveService.current_directory_channels[this.drive_channel].parent_id &&
      WorkspaceUserRights.hasWorkspacePrivilege()
    ) {
      plus_menu = plus_menu.concat([
        { type: 'separator' },
        {
          type: 'menu',
          icon: 'database',
          text: Languages.t(
            'scenes.apps.drive.new_external_storage',
            [],
            'Ajouter un stockage externe',
          ),
          submenu: externalStorageMenu,
        },
      ]);
    }

    list.push(
      <div className="app">
        <div className={'drive_app drive_view list'}>
          <UploadZone
            disabled={in_trash || WorkspaceUserRights.isNotConnected()}
            ref={node => (this.upload_zone = node)}
            disableClick
            parent={this.state.app_drive_service.current_directory_channels[this.drive_channel]}
            driveCollectionKey={
              this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
            }
            uploadOptions={{ workspace_id: this.state.workspaces.currentWorkspaceId }}
            allowPaste={true}
          >
            <div className="drive_top">
              <div className="path app_title">
                <PerfectScrollbar component="div" options={{ suppressScrollY: true }}>
                  {this.buildPath()}
                </PerfectScrollbar>
              </div>

              <div className="nomobile info">
                {!in_trash && (
                  <span>
                    {Numbers.humanFileSize(
                      Collections.get('drive').find(
                        this.state.app_drive_service.current_directory_channels[this.drive_channel]
                          .id,
                      )
                        ? Collections.get('drive').find(
                            this.state.app_drive_service.current_directory_channels[
                              this.drive_channel
                            ].id,
                          ).size
                        : 0 || 0,
                      true,
                    )}{' '}
                    {Languages.t('scenes.apps.drive.used', [], 'utilisé dans ce dossier')}
                  </span>
                )}
                {!!in_trash && WorkspaceUserRights.hasWorkspacePrivilege() && (
                  <a
                    className="error right-margin"
                    onClick={() => {
                      AlertManager.confirm(() => {
                        DriveService.emptyTrash(this.state.workspaces.currentWorkspaceId, () => {
                          DriveService.toggleInTrash(this.drive_channel);
                        });
                        SelectionsManager.unselectAll(
                          this.state.app_drive_service.current_collection_key_channels[
                            this.drive_channel
                          ],
                        );
                      });
                    }}
                  >
                    <Icon type="trash" />
                    {' ' +
                      Languages.t('scenes.apps.drive.trash_empty_menu', [], 'Vider la corbeille')}
                  </a>
                )}
              </div>

              <div
                className="nomobile options app_right_btn app_title"
                onClick={evt => {
                  MenusManager.openMenu(general_menu, { x: evt.clientX, y: evt.clientY }, 'bottom');
                }}
              >
                {Object.keys(current_selection).length <= 1
                  ? Languages.t('scenes.apps.drive.top_menu_more')
                  : Languages.t('scenes.apps.drive.top_menu_no_items', [
                      Object.keys(current_selection).length,
                    ])}
                <ChevronDownIcon className="m-icon-small" />
              </div>
            </div>

            {in_trash && (
              <div className="smalltext drive_trash_info">
                <a
                  onClick={() => {
                    DriveService.toggleInTrash(this.drive_channel);
                  }}
                >
                  {Languages.t('scenes.apps.drive.go_out_trash_menu', [], 'Sortir de la corbeille')}
                </a>
              </div>
            )}

            <DriveMultiSelector
              scroller={this.drive_scroller}
              selectionType={
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
              }
            >
              {!this.state.drive_repository.did_load_first_time[
                this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
              ] &&
                files.length + directories.length == 0 && (
                  <div className="loading">
                    <Loader color="#CCC" className="app_loader" />
                  </div>
                )}

              {(files.length + directories.length > 0 ||
                (this.state.drive_repository.sources[
                  this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
                ] &&
                  !this.state.drive_repository.sources[
                    this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
                  ].http_loading &&
                  this.state.drive_repository.did_load_first_time[
                    this.state.app_drive_service.current_collection_key_channels[this.drive_channel]
                  ])) && (
                <div>
                  {directories.length > 0 && (
                    <div className="app_title">
                      {Languages.t('scenes.apps.drive.folder_subtitle', [], 'Dossiers')}
                    </div>
                  )}

                  <DriveList
                    key={'animted-directories-' + directory_id}
                    directories
                    driveCollectionKey={
                      this.state.app_drive_service.current_collection_key_channels[
                        this.drive_channel
                      ]
                    }
                    selectionType={
                      this.state.app_drive_service.current_collection_key_channels[
                        this.drive_channel
                      ]
                    }
                    data={directories}
                    view_mode={DriveService.view_mode}
                    onClick={element => {
                      if (element.id) {
                        this.changeCurrentDirectory(element);
                      }
                    }}
                  />

                  {directories.length > 0 && [<br />, <br />]}

                  {files.length > 0 && (
                    <div className="app_title">
                      {Languages.t('scenes.apps.drive.files_subtitle', [], 'Fichiers')}
                    </div>
                  )}

                  <DriveList
                    key={'animted-files-' + directory_id}
                    driveCollectionKey={
                      this.state.app_drive_service.current_collection_key_channels[
                        this.drive_channel
                      ]
                    }
                    selectionType={
                      this.state.app_drive_service.current_collection_key_channels[
                        this.drive_channel
                      ]
                    }
                    data={files}
                    view_mode={DriveService.view_mode}
                  />
                </div>
              )}
            </DriveMultiSelector>
          </UploadZone>

          {!in_trash && !WorkspaceUserRights.isNotConnected() && <MainPlus menu={plus_menu} />}
        </div>
      </div>,
    );

    return list;
  }
}
