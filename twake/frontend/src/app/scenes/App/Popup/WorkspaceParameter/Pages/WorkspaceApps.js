import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceService from 'services/workspaces/workspaces.js';
import Emojione from 'components/Emojione/Emojione.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import Menu from 'components/Menus/Menu.js';
import Table from 'components/Table/Table.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import AppsParameters from 'scenes/App/Popup/AppsParameters/AppsParameters.js';
import Button from 'components/Buttons/Button.js';

import WorkspaceAppsSearch from './WorkspaceAppsSearch.js';
import Loader from 'components/Loader/Loader.js';

import './Pages.scss';

export default class WorkspaceApps extends Component {
  constructor(props) {
    super(props);
    this.state = {
      edit_app_id: null,
      add_new_app: props.searchApps,
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
  }

  renderAppMenu(app, ga, in_workspace) {
    var menu = [];

    var is_group_manager = WorkspaceUserRights.hasGroupPrivilege('MANAGE_APPS');

    if (is_group_manager) {
      menu = [
        {
          text: Languages.t(
            'scenes.app.popup.workspaceparameter.pages.forced_apps_text',
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
              <div>
                <Switch
                  label={Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.automatique_label',
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
            'scenes.app.popup.workspaceparameter.pages.automatique_option_text',
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
          'scenes.app.popup.workspaceparameter.pages.remove_from_workspace_text',
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
          'scenes.app.popup.workspaceparameter.pages.remove_from_company_text',
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
    if (this.state.add_new_app) {
      return <WorkspaceAppsSearch exit={() => this.setState({ add_new_app: false })} />;
    }

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
            'scenes.app.popup.workspaceparameter.pages.apps_connectors_title',
            [],
<<<<<<< HEAD
            'Applications et connecteurs'
=======
            'Applications et connecteurs',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
        </div>

        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.installed_apps_subtitle',
              [],
<<<<<<< HEAD
              'Applications installées'
=======
              'Applications installées',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>

          {!WorkspacesApps.loading && workspace_apps.length == 0 && (
            <div className="smalltext">
              <Emojione type=":information_source:" />{' '}
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.no_app_information',
                [],
<<<<<<< HEAD
                "Vous n'avez aucune application dans cet espace de travail"
=======
                "Vous n'avez aucune application dans cet espace de travail",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
              .
            </div>
          )}

          {workspace_apps.length > 0 && (
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.installed_apps_information',
                [workspace_apps.length],
<<<<<<< HEAD
                'Applications installées dans cet espaces de travail $1'
=======
                'Applications installées dans cet espaces de travail $1',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>
          )}

          {workspace_apps.length > 0 && (
            <Table
              column={[
                {
                  title: 'Application',
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
                  title: '',
                  width: 100,
                  render: row => {
                    return (
                      <div className="action">
                        {((row.display || {}).configuration || {}).can_configure_in_workspace && (
                          <Button
                            className="small secondary"
                            value={Languages.t(
                              'scenes.app.popup.workspaceparameter.pages.configure_button',
                              [],
                              Languages.t(
                                'scenes.app.popup.workspaceparameter.pages.configure_button',
                                [],
<<<<<<< HEAD
                                'Configurer'
                              )
=======
                                'Configurer',
                              ),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                            )}
                            style={{ marginTop: 0, marginBottom: 0, width: 'auto' }}
                            onClick={() => {
                              WorkspacesApps.openAppPopup(row.id);
                              WorkspacesApps.notifyApp(
                                row.id,
                                Languages.t(
                                  'scenes.app.popup.workspaceparameter.pages.configuration_notif',
                                  [],
<<<<<<< HEAD
                                  'configuration'
=======
                                  'configuration',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                                ),
                                Languages.t(
                                  'scenes.app.popup.workspaceparameter.pages.worspace_notif',
                                  [],
<<<<<<< HEAD
                                  'workspace'
                                ),
                                {}
=======
                                  'workspace',
                                ),
                                {},
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                              );
                            }}
                          />
                        )}
                      </div>
                    );
                  },
                },
                {
                  title: '',
                  width: WorkspaceUserRights.hasWorkspacePrivilege('MANAGE_APPS') ? 30 : 1,
                  render: row => {
                    if (!WorkspaceUserRights.hasGroupPrivilege('MANAGE_APPS')) {
                      return '';
                    }
                    return (
                      <div className="action">
                        {this.renderAppMenu(
                          row,
                          WorkspacesApps.apps_by_group[workspaceService.currentGroupId][row.id] ||
                            {},
<<<<<<< HEAD
                          true
=======
                          true,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                        )}
                      </div>
                    );
                  },
                },
              ]}
              data={workspace_apps}
            />
          )}

          {WorkspacesApps.loading_by_workspace[workspaceService.currentWorkspaceId] &&
            group_apps.length == 0 && <Loader color="#CCC" className="parameters_loader" />}

          {group_apps.length > 0 && (
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.installed_apps_message',
                [group_apps.length],
<<<<<<< HEAD
                "Applications installées dans d'autres espaces de l'entreprise $1"
=======
                "Applications installées dans d'autres espaces de l'entreprise $1",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>
          )}

          {group_apps.length > 0 && (
            <Table
              unFocused
              noHeader
              column={[
                {
                  title: 'Application',
                  dataIndex: 'name',
                  render: _row => {
                    var row = _row.app;
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
                  title: '',
                  width: 80,
                  render: _row => {
                    var row = _row.app;
                    return (
                      <div className="action">
                        <Button
                          className="small"
                          value={'Installer'}
                          style={{ marginTop: 0, marginBottom: 0, width: 'auto' }}
                          onClick={() => {
                            WorkspacesApps.activateApp(row.id);
                          }}
                        />
                      </div>
                    );
                  },
                },
                {
                  title: '',
                  width: 30,
                  render: _row => {
                    var row = _row.app;
                    return <div className="action">{this.renderAppMenu(row, _row, false)}</div>;
                  },
                },
              ]}
              data={group_apps}
            />
          )}

          <ButtonWithTimeout
            small
            className="buttonValidation"
            value={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.researching_apps_button',
              [],
<<<<<<< HEAD
              'Rechercher des applications...'
=======
              'Rechercher des applications...',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            onClick={() => {
              this.setState({ add_new_app: true });
            }}
          />
          <br />
        </div>

        {WorkspaceUserRights.hasGroupPrivilege('MANAGE_APPS') && (
          <div className="group_section">
            <div className="subtitle">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.company_developped_apps_subtitle',
                [],
<<<<<<< HEAD
                "Applications développées par l'entreprise"
=======
                "Applications développées par l'entreprise",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>

            <Attribute
              autoOpen={developed.length > 0}
              label={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.your_apps_label',
                [],
<<<<<<< HEAD
                'Vos applications'
=======
                'Vos applications',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
              description={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.your_apps_description',
                [],
<<<<<<< HEAD
                'Créez et administrez vos applications et connecteurs.'
=======
                'Créez et administrez vos applications et connecteurs.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            >
              <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
                <Emojione type=":control_knobs:" />{' '}
                <a className="text" onClick={() => popupManager.open(<AppsParameters />)}>
                  {Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.access_apps',
                    [],
<<<<<<< HEAD
                    'Accédez à vos applications et connecteurs'
=======
                    'Accédez à vos applications et connecteurs',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  )}
                </a>
              </div>
            </Attribute>
          </div>
        )}
      </div>
    );
  }
}
