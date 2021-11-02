import React, { Component } from 'react';

import Languages from 'services/languages/languages';
import Collections from 'app/services/Depreciated/Collections/Collections.js';
import workspaceService from 'services/workspaces/workspaces.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Menu from 'components/Menus/Menu.js';
import Table from 'components/Table/Table';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import AlertManager from 'services/AlertManager/AlertManager';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch';
import WorkspaceUserRights from 'services/workspaces/WorkspaceUserRights';
import Button from 'components/Buttons/Button.js';
import Icon from 'components/Icon/Icon.js';

import WorkspaceAppsEditor from './WorkspaceAppsEditor.js';
import Api from 'services/Api';

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
      '/ajax/market/app/get_developed',
      { workspace_id: workspaceService.currentWorkspaceId },
      res => {
        this.setState({ loading_developed: false });

        if (res.data) {
          res.data.forEach(app => {
            Collections.get('applications').completeObject(app);
          });

          Collections.get('applications').notify();
        }
      },
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
            "Forcer dans toute l'entreprise",
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
                    'Automatique',
                  )}
                  checked={ga.workspace_default}
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
            "Si vous activez 'Automatique', cette application sera automatiquement ajoutée dans les prochains espaces de travail de cette entreprise.",
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
          "Supprimer de l'espace",
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
          "Supprimer de toute l'entreprise",
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
    // eslint-disable-next-line no-unused-vars
    var group = Collections.get('groups').find(workspace.group.id);

    var developed = Collections.get('applications')
      .findBy({ group_id: workspace.group.id })
      .filter(item => item.available_categories);

    var workspaces_app_ids = Object.keys(
      WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId],
    );
    var workspace_apps = workspaces_app_ids.map(
      id => WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId][id],
    );
    var group_apps = Object.keys(WorkspacesApps.apps_by_group[workspaceService.currentGroupId])
      .filter(id => workspaces_app_ids.indexOf(id) < 0)
      .map(id => WorkspacesApps.apps_by_group[workspaceService.currentGroupId][id]);

    // eslint-disable-next-line no-unused-vars
    var all_apps = workspace_apps.concat(group_apps);

    return (
      <div className="apps">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.appsparameters.pages.apps_title',
            [],
            'Vos applications et connecteurs',
          )}
        </div>

        {WorkspaceUserRights.hasGroupPrivilege('MANAGE_APPS') && (
          <div className="group_section">
            <div className="subtitle">
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.developped_apps_subtitle',
                [],
                "Applications développées par l'entreprise",
              )}
            </div>

            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.apps_connectors_small_text',
                [],
                'Créez et administrez vos applications et connecteurs.',
              )}
            </div>

            {developed.length === 0 && this.state.loading_developed && (
              <div className="smalltext">
                {Languages.t('scenes.app.popup.appsparameters.pages.loading')}
              </div>
            )}

            {developed.length === 0 && !this.state.loading_developed && (
              <div className="smalltext">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.current_informations_apps_connectors',
                  [],
                  "Vous n'avez pas créé d'application pour le moment. Avant de créer une application ou un connecteur, vérifiez que celle-ci n'existe pas déjà dans notre marché d'applications.",
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
                      'Application',
                    ),
                    dataIndex: 'name',
                    render: row => {
                      return (
                        <div className="absolute_position">
                          <Icon
                            className="no-margin-left"
                            style={{ fontSize: '24px' }}
                            type={WorkspacesApps.getAppIcon(row) || ''}
                          />
                          <div className="fix_text_padding_medium text-complete-width">
                            {row.name} ({row.app_group_name ? row.app_group_name + '.' : ''}
                            {row.code})
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    title: Languages.t(
                      'scenes.app.popup.appsparameters.pages.status_tilte',
                      [],
                      'État',
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
                                'Application interne',
                              )}
                            </div>
                          )}
                          {row.public && !row.is_available_to_public && (
                            <div className="tag orange">
                              {Languages.t(
                                'scenes.app.popup.appsparameters.pages.waiting_availability_application',
                                [],
                                'En attente...',
                              )}
                            </div>
                          )}
                          {row.public && row.is_available_to_public && (
                            <div className="tag blue">
                              {Languages.t(
                                'scenes.app.popup.appsparameters.pages.public_availability_application',
                                [],
                                'Application publique',
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
                      'Instal.',
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
                              'Afficher',
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
                onRequestMore={() => new Promise(resolve => resolve(developed))}
              />
            )}

            <ButtonWithTimeout
              className="small buttonValidation medium"
              value={Languages.t(
                'scenes.app.popup.appsparameters.pages.create_app_button',
                [],
                'Créer une application',
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
