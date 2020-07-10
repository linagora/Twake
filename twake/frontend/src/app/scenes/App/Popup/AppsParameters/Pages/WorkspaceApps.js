<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import workspaceService from 'services/workspaces/workspaces.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Menu from 'components/Menus/Menu.js';
import Table from 'components/Table/Table.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import Button from 'components/Buttons/Button.js';

import WorkspaceAppsEditor from './WorkspaceAppsEditor.js';
import Api from 'services/api.js';

import './Pages.scss';

export default class WorkspaceApps extends Component {
  constructor() {
    super();
    this.state = {
      edit_app_id: null,
      add_new_app: false,
      workspaces_apps: WorkspacesApps,
      applications_repository: Collections.get('applications'),
      workspace_user_rights: WorkspaceUserRights,
    };

    Collections.get('applications').addListener(this);
    WorkspacesApps.addListener(this);
    WorkspaceUserRights.addListener(this);
  }

  componentWillUnmount() {
    Collections.get('applications').removeListener(this);
    WorkspacesApps.removeListener(this);
    WorkspaceUserRights.removeListener(this);
  }

  componentDidMount() {
    this.setState({ loading_developed: true });

    WorkspacesApps.loadGroupApps();

    Api.post(
      'market/app/get_developed',
      { workspace_id: workspaceService.currentWorkspaceId },
      res => {
        this.setState({ loading_developed: false });

        if (res.data) {
          res.data.forEach(app => {
            Collections.get('applications').completeObject(app);
          });

          Collections.get('applications').notify();
        }
<<<<<<< HEAD
      }
=======
      },
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
  }

  renderAppMenu(app, ga, in_workspace) {
    var menu = [];

    var is_group_manager = WorkspaceUserRights.hasGroupPrivilege('MANAGE_APPS');

    if (is_group_manager) {
      menu = [
        {
          text: Languages.t(
            'scenes.app.popup.appsparameters.pages.button_force',
            [],
<<<<<<< HEAD
            "Forcer dans toute l'entreprise"
=======
            "Forcer dans toute l'entreprise",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          ),
          onClick: () => {
            AlertManager.confirm(() => WorkspacesApps.forceInEntreprise(app.id));
          },
        },
        {
          type: 'react-element',
          reactElement: () => {
            return (
              <div style={{ padding: 10, paddingBottom: 0 }}>
                <Switch
                  label={Languages.t(
                    'scenes.app.popup.appsparameters.pages.automatique_label',
                    [],
<<<<<<< HEAD
                    'Automatique'
=======
                    'Automatique',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  )}
                  value={ga.workspace_default}
                  onChange={state =>
                    WorkspacesApps.defaultForWorkspacesInEntreprise(app.id, !ga.workspace_default)
                  }
                />
              </div>
            );
          },
        },
        {
          type: 'text',
          text: Languages.t(
            'scenes.app.popup.appsparameters.pages.automatique_option_information',
            [],
<<<<<<< HEAD
            "Si vous activez 'Automatique', cette application sera automatiquement ajoutée dans les prochains espaces de travail de cette entreprise."
=======
            "Si vous activez 'Automatique', cette application sera automatiquement ajoutée dans les prochains espaces de travail de cette entreprise.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          ),
        },
        { type: 'separator' },
      ];
    }

    if (in_workspace) {
      menu.push({
        text: Languages.t(
          'scenes.app.popup.appsparameters.pages.remove_app_from_workspace',
          [],
<<<<<<< HEAD
          "Supprimer de l'espace"
=======
          "Supprimer de l'espace",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        ),
        className: 'error',
        onClick: () => {
          AlertManager.confirm(() => WorkspacesApps.desactivateApp(app.id));
        },
      });
    }

    if (is_group_manager) {
      menu.push({
        text: Languages.t(
          'scenes.app.popup.appsparameters.pages.remove_app_from_company',
          [],
<<<<<<< HEAD
          "Supprimer de toute l'entreprise"
=======
          "Supprimer de toute l'entreprise",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        ),
        className: 'error',
        onClick: () => {
          AlertManager.confirm(() => WorkspacesApps.forceRemoveFromEntreprise(app.id));
        },
      });
    }

    return (
      <Menu menu={menu} style={{ padding: 4 }}>
        <EditIcon className="m-icon-small" />
      </Menu>
    );
  }

  render() {
    if (this.state.edit_app_id != null) {
      return (
        <WorkspaceAppsEditor
          exit={() => this.setState({ edit_app_id: null })}
          appId={this.state.edit_app_id}
        />
      );
    }

    var workspace_id = workspaceService.currentWorkspaceId;
    var workspace = Collections.get('workspaces').find(workspace_id);
    var group = Collections.get('groups').find(workspace.group.id);

    var developed = Collections.get('applications')
      .findBy({ group_id: workspace.group.id })
      .filter(item => item.available_categories);

    var workspaces_app_ids = Object.keys(
<<<<<<< HEAD
      WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId]
    );
    var workspace_apps = workspaces_app_ids.map(
      id => WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId][id]
=======
      WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId],
    );
    var workspace_apps = workspaces_app_ids.map(
      id => WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId][id],
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
    );
    var group_apps = Object.keys(WorkspacesApps.apps_by_group[workspaceService.currentGroupId])
      .filter(id => workspaces_app_ids.indexOf(id) < 0)
      .map(id => WorkspacesApps.apps_by_group[workspaceService.currentGroupId][id]);

    var all_apps = workspace_apps.concat(group_apps);

    return (
      <div className="apps">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.appsparameters.pages.apps_title',
            [],
<<<<<<< HEAD
            'Vos applications et connecteurs'
=======
            'Vos applications et connecteurs',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
        </div>

        {WorkspaceUserRights.hasGroupPrivilege('MANAGE_APPS') && (
          <div className="group_section">
            <div className="subtitle">
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.developped_apps_subtitle',
                [],
<<<<<<< HEAD
                "Applications développées par l'entreprise"
=======
                "Applications développées par l'entreprise",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>

            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.apps_connectors_small_text',
                [],
<<<<<<< HEAD
                'Créez et administrez vos applications et connecteurs.'
=======
                'Créez et administrez vos applications et connecteurs.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>

            {developed.length == 0 && this.state.loading_developed && (
              <div className="smalltext">
                Languages.t('scenes.app.popup.appsparameters.pages.loading', [], "Chargement...")
              </div>
            )}

            {developed.length == 0 && !this.state.loading_developed && (
              <div className="smalltext">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.current_informations_apps_connectors',
                  [],
<<<<<<< HEAD
                  "Vous n'avez pas créé d'application pour le moment. Avant de créer une application ou un connecteur, vérifiez que celle-ci n'existe pas déjà dans notre marché d'applications."
=======
                  "Vous n'avez pas créé d'application pour le moment. Avant de créer une application ou un connecteur, vérifiez que celle-ci n'existe pas déjà dans notre marché d'applications.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
            )}

            {!this.state.loading_developed && developed.length > 0 && (
              <Table
                column={[
                  {
                    title: Languages.t(
                      'scenes.app.popup.appsparameters.pages.application_title',
                      [],
<<<<<<< HEAD
                      'Application'
=======
                      'Application',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    ),
                    dataIndex: 'name',
                    render: row => {
                      return (
                        <div className="absolute_position">
                          <div
                            className="app_icon"
                            style={{
                              backgroundImage:
                                'url(' + (row.icon_url || '/public/img/default_app_icon.png') + ')',
                            }}
                          />
                          <div className="fix_text_padding_medium text-complete-width">
                            {row.name} ({row.app_group_name ? row.app_group_name + '.' : ''}
                            {row.simple_name})
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    title: Languages.t(
                      'scenes.app.popup.appsparameters.pages.status_tilte',
                      [],
<<<<<<< HEAD
                      'État'
=======
                      'État',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    ),
                    width: 140,
                    dataIndex: 'public',
                    render: row => {
                      return (
                        <div style={{ textAlign: 'right' }} className="fix_text_padding_medium">
                          {!row.public && !row.is_available_to_public && (
                            <div className="tag">
                              {Languages.t(
                                'scenes.app.popup.appsparameters.pages.interne_availability_application',
                                [],
<<<<<<< HEAD
                                'Application interne'
=======
                                'Application interne',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                              )}
                            </div>
                          )}
                          {row.public && !row.is_available_to_public && (
                            <div className="tag orange">
                              {Languages.t(
                                'scenes.app.popup.appsparameters.pages.waiting_availability_application',
                                [],
<<<<<<< HEAD
                                'En attente...'
=======
                                'En attente...',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                              )}
                            </div>
                          )}
                          {row.public && row.is_available_to_public && (
                            <div className="tag blue">
                              {Languages.t(
                                'scenes.app.popup.appsparameters.pages.public_availability_application',
                                [],
<<<<<<< HEAD
                                'Application publique'
=======
                                'Application publique',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                              )}
                            </div>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    title: Languages.t(
                      'scenes.app.popup.appsparameters.pages.installation',
                      [],
<<<<<<< HEAD
                      'Instal.'
=======
                      'Instal.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                    ),
                    titleStyle: { textAlign: 'right' },
                    width: 60,
                    dataIndex: 'install_count',
                    render: row => {
                      return (
                        <div
                          style={{ textAlign: 'right', width: '100%' }}
                          className="fix_text_padding_medium"
                        >
                          {row.install_count || 0}
                        </div>
                      );
                    },
                  },
                  {
                    title: '',
                    width: 80,
                    render: row => {
                      return (
                        <div className="action">
                          <Button
                            className="small"
                            value={Languages.t(
                              'scenes.app.popup.appsparameters.pages.show_button',
                              [],
<<<<<<< HEAD
                              'Afficher'
=======
                              'Afficher',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                            )}
                            style={{ marginTop: 0, width: 'auto' }}
                            onClick={() => {
                              this.setState({ edit_app_id: row.id });
                            }}
                          />
                        </div>
                      );
                    },
                  },
                ]}
                data={developed}
              />
            )}

            <ButtonWithTimeout
              className="small buttonValidation medium"
              value={Languages.t(
                'scenes.app.popup.appsparameters.pages.create_app_button',
                [],
<<<<<<< HEAD
                'Créer une application'
=======
                'Créer une application',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
              onClick={() => {
                this.setState({ edit_app_id: 'new' });
              }}
            />
          </div>
        )}
      </div>
    );
  }
}
