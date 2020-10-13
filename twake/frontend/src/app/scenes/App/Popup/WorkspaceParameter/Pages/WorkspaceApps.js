import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceService from 'services/workspaces/workspaces.js';
import Emojione from 'components/Emojione/Emojione';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import Menu from 'components/Menus/Menu.js';
import Table from 'components/Table/Table';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import EditIcon from '@material-ui/icons/MoreHorizOutlined';
import Switch from 'components/Inputs/Switch.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import AppsParameters from 'scenes/App/Popup/AppsParameters/AppsParameters.js';
import Button from 'components/Buttons/Button.js';
import WorkspaceAppsEditor from '../../AppsParameters/Pages/WorkspaceAppsEditor.js';

import WorkspaceAppsSearch from './WorkspaceAppsSearch.js';
import Loader from 'components/Loader/Loader.js';

import './Pages.scss';
import Icon from 'components/Icon/Icon.js';

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
              <div>
                <Switch
                  label={Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.automatique_label',
                    [],
                    'Automatique',
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
            "Si vous activez 'Automatique', cette application sera automatiquement ajoutée dans les prochains espaces de travail de cette entreprise.",
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
          'scenes.app.popup.workspaceparameter.pages.remove_from_company_text',
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
      WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId],
    );
    var workspace_apps = workspaces_app_ids.map(
      id => WorkspacesApps.apps_by_workspace[workspaceService.currentWorkspaceId][id],
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
            'Applications et connecteurs',
          )}
        </div>

        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.workspaceparameter.pages.installed_apps_subtitle',
              [],
              'Applications installées',
            )}
          </div>

          {!WorkspacesApps.loading && workspace_apps.length == 0 && (
            <div className="smalltext">
              <Emojione type=":information_source:" />{' '}
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.no_app_information',
                [],
                "Vous n'avez aucune application dans cet espace de travail",
              )}
              .
            </div>
          )}

          {workspace_apps.length > 0 && (
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.installed_apps_information',
                [workspace_apps.length],
                'Applications installées dans cet espaces de travail $1',
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
                    var icon = row.icon_url;
                    return (
                      <div className="absolute_position">
                        <Icon
                          className="no-margin-left"
                          style={{ fontSize: '24px' }}
                          type={WorkspacesApps.getAppIcon(row) || ''}
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
                                'Configurer',
                              ),
                            )}
                            style={{ marginTop: 0, marginBottom: 0, width: 'auto' }}
                            onClick={() => {
                              WorkspacesApps.openAppPopup(row.id);
                              WorkspacesApps.notifyApp(
                                row.id,
                                Languages.t(
                                  'scenes.app.popup.workspaceparameter.pages.configuration_notif',
                                  [],
                                  'configuration',
                                ),
                                Languages.t(
                                  'scenes.app.popup.workspaceparameter.pages.worspace_notif',
                                  [],
                                  'workspace',
                                ),
                                {},
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
                  width: WorkspaceUserRights.hasWorkspacePrivilege() ? 30 : 1,
                  render: row => {
                    if (!WorkspaceUserRights.hasWorkspacePrivilege()) {
                      return '';
                    }
                    return (
                      <div className="action">
                        {this.renderAppMenu(
                          row,
                          WorkspacesApps.apps_by_group[workspaceService.currentGroupId][row.id] ||
                            {},
                          true,
                        )}
                      </div>
                    );
                  },
                },
              ]}
              onRequestMore={() => new Promise(resolve => resolve(workspace_apps))}
            />
          )}

          {WorkspacesApps.loading_by_workspace[workspaceService.currentWorkspaceId] &&
            group_apps.length == 0 && <Loader color="#CCC" className="parameters_loader" />}

          {group_apps.length > 0 && (
            <div className="smalltext">
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.installed_apps_message',
                [group_apps.length],
                "Applications installées dans d'autres espaces de l'entreprise $1",
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
              onRequestMore={() => new Promise(resolve => resolve(group_apps))}
            />
          )}

          <ButtonWithTimeout
            small
            className="buttonValidation"
            value={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.researching_apps_button',
              [],
              'Rechercher des applications...',
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
                "Applications développées par l'entreprise",
              )}
            </div>

            <Attribute
              autoOpen={true}
              description={Languages.t(
                'scenes.app.popup.appsparameters.pages.apps_connectors_small_text',
                'Gérer vos applications et connecteurs.',
              )}
            >
              <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
                <Emojione type=":control_knobs:" />{' '}
                <a href="#" className="text" onClick={() => popupManager.open(<AppsParameters />)}>
                  {Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.access_apps',
                    [],
                    'Accédez à vos applications et connecteurs',
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
