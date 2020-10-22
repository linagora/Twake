import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import workspaceService from 'services/workspaces/workspaces.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Api from 'services/api.js';
import InputIcon from 'components/Inputs/InputIcon.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import Icon from 'components/Icon/Icon.js';

import './Pages.scss';

export default class WorkspaceAppsSearch extends Component {
  constructor(props) {
    super();
    this.state = {
      loading: false,
      current_app_id: null,
      results: [],
    };
  }

  componentDidMount() {
    this.search('');
  }

  search(query) {
    query = query.trim();

    var workspace_id = workspaceService.currentWorkspaceId;
    var workspace = Collections.get('workspaces').find(workspace_id);
    var group = Collections.get('groups').find(workspace.group.id);

    var data = {
      group_id: group.id,
      query: query,
    };

    var source = {
      http: 'market/app/search',
      http_data: data,
      collection: 'applications',
      collection_filter: (item, query) => {
        var res =
          (item.is_available_to_public || item.group_id == group.id) &&
          (item.name + ' ' + item.description + ' ' + (item.categories || []).join(' '))
            .toLocaleLowerCase()
            .indexOf(query.toLocaleLowerCase()) >= 0;
        return res;
      },
    };

    Api.search(source, query, Collections, res => {
      this.setState({ results: res });
    });
  }

  renderApplications(list, buttons) {
    return list.map(item => {
      return (
        <div className="application">
          <Icon
            className="no-margin-left"
            style={{ fontSize: '24px' }}
            type={WorkspacesApps.getAppIcon(item) || ''}
          />
          <div className="market_app_content">
            <div className="market_app_title">{item.name}</div>
            <div className="market_app_description">{(item.description || '').split('\n')[0]}</div>
          </div>
          {buttons !== false && (
            <div className="market_app_buttons">
              <ButtonWithTimeout
                className="small buttonValidation"
                value={Languages.t(
                  'scenes.app.popup.workspaceparameter.pages.show_button',
                  [],
                  'Afficher',
                )}
                disabled={this.state.loading}
                loading={this.state.loading}
                onClick={() => {
                  this.setState({ current_app_id: item.id });
                }}
              />
            </div>
          )}
        </div>
      );
    });
  }

  install() {
    AlertManager.confirm(
      () => {
        WorkspacesApps.activateApp(this.state.current_app_id);
        this.state.current_app_id = null;
        this.props.exit();
      },
      () => {},
      {
        text: Languages.t(
          'scenes.app.popup.workspaceparameter.pages.installed_app_information',
          [],
          "Installer l'application dans cet espace de travail.",
        ),
      },
    );
  }

  render() {
    var workspace_id = workspaceService.currentWorkspaceId;
    var workspace = Collections.get('workspaces').find(workspace_id);
    var group = Collections.get('groups').find(workspace.group.id);

    if (this.state.current_app_id) {
      var application = Collections.get('applications').find(this.state.current_app_id);

      return (
        <div className="application_search fade_in">
          <div className="title">
            <div
              className="app_icon"
              style={{
                backgroundImage:
                  'url(' + (application.icon_url || '/public/img/default_app_icon.png') + ')',
                marginTop: 0,
                marginRight: 5,
              }}
            />
            {application.name}
          </div>

          <div className="group_section">
            <div className="text">
              <a href="#" key="goback" onClick={() => this.setState({ current_app_id: null })}>
                {Languages.t(
                  'scenes.app.popup.workspaceparameter.pages.back_to_search_button',
                  [],
                  'Retour à la recherche',
                )}
              </a>
            </div>

            <br />

            <div className="subtitle" style={{ marginBottom: 0 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.description',
                [],
                'Description',
              )}
            </div>

            <TagPicker
              readOnly
              inline
              value={(application.categories || []).map(item => {
                return { name: item, id: item };
              })}
            />

            <div className="text markdown" style={{ marginTop: 10 }}>
              {PseudoMarkdownCompiler.compileToHTML(
                PseudoMarkdownCompiler.compileToJSON(application.description || ''),
              )}
            </div>

            {application.website && [
              <br />,
              <div className="text">
                <a href={application.website} target="_blank">
                  {application.website}
                </a>
              </div>,
            ]}

            <div className="smalltext">Installations : {application.install_count || 0}</div>
          </div>

          <div className="group_section">
            <div className="subtitle" style={{ marginBottom: 0 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.write_access_subtitle',
                [],
                'Accès en écriture',
              )}
            </div>
            <TagPicker
              readOnly
              inline
              value={(application.capabilities || []).map(item => {
                return { name: item, id: item };
              })}
            />
            {!application.capabilities ||
              (application.capabilities.length == 0 && (
                <div className="smalltext">
                  {Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.no_access',
                    [],
                    'Aucun accès.',
                  )}
                </div>
              ))}

            <div className="subtitle" style={{ marginBottom: 0, marginTop: 10 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.read_access_subtitle',
                [],
                'Accès en lecture',
              )}
            </div>
            <TagPicker
              readOnly
              inline
              value={(application.privileges || []).map(item => {
                return { name: item, id: item };
              })}
            />
            {!application.privileges ||
              (application.privileges.length == 0 && (
                <div className="smalltext">
                  {Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.no_access',
                    [],
                    'Aucun accès.',
                  )}
                </div>
              ))}

            <div className="subtitle" style={{ marginBottom: 0, marginTop: 10 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.webhooks_access_subtitle',
                [],
                'Accès aux webhooks',
              )}
            </div>
            <TagPicker
              readOnly
              inline
              value={(application.hooks || []).map(item => {
                return { name: item, id: item };
              })}
            />
            {!application.hooks ||
              (application.hooks.length == 0 && (
                <div className="smalltext">
                  {Languages.t(
                    'scenes.app.popup.workspaceparameter.pages.no_access',
                    [],
                    'Aucun accès.',
                  )}
                </div>
              ))}
          </div>

          <div className="group_section">
            <ButtonWithTimeout
              className="medium buttonValidation"
              value={Languages.t(
                'scenes.app.popup.workspaceparameter.pages.install_button',
                [],
                'Installer',
              )}
              disabled={this.state.loading}
              loading={this.state.loading}
              onClick={() => {
                this.install();
              }}
            />
          </div>
        </div>
      );
    }

    var results_workspace = [];
    var results_group = [];
    var results_developed = [];
    var results_all = this.state.results;

    return (
      <div className="application_search fade_in">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.workspaceparameter.pages.apps_research_title',
            [],
            'Rechercher des applications',
          )}
        </div>

        <div className="group_section">
          <div className="text" style={{ marginBottom: 16 }}>
            <a
              key="show_all_apps"
              href="https://twakeapp.com"
              target="_blank"
              style={{ float: 'right' }}
            >
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.show_all_apps_text',
                [],
                "Voir la liste d'applications",
              )}
            </a>
            <a href="#" key="goback" onClick={() => this.props.exit()}>
              {Languages.t('general.back', [], 'Retour')}
            </a>
          </div>

          <InputIcon
            className="medium full_width"
            autoFocus
            icon={'search'}
            value={this.state.query}
            onChange={evt => {
              this.search(evt.target.value);
              this.setState({ query: evt.target.value });
            }}
            placeholder={Languages.t(
              'scenes.app.popup.workspaceparameter.pages.research_by',
              [],
              'Rechercher des applications par nom et catégories',
            )}
          />
        </div>

        {results_workspace.length > 0 && (
          <div className="group_section">
            <div className="smalltext" style={{ padding: 0 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.apps_small_text',
                [],
                'Applications de cet espace de travail',
              )}
            </div>

            {this.renderApplications(results_workspace)}
          </div>
        )}

        {results_group.length > 0 && (
          <div className="group_section">
            <div className="smalltext" style={{ padding: 0 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.apps_company_small_text',
                [],
                'Applications de votre entreprise',
              )}
            </div>

            {this.renderApplications(results_group)}
          </div>
        )}

        {results_developed.length > 0 && (
          <div className="group_section">
            <div className="smalltext" style={{ padding: 0 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.developped_apps_small_text',
                [],
                'Applications développées par votre entreprise',
              )}
            </div>

            {this.renderApplications(results_developed)}
          </div>
        )}

        {results_all.length > 0 && (
          <div className="group_section">
            <div className="smalltext" style={{ padding: 0 }}>
              {Languages.t(
                'scenes.app.popup.workspaceparameter.pages.all_apps_small_text',
                [],
                'Toutes les applications',
              )}
            </div>

            {this.renderApplications(results_all)}
          </div>
        )}
      </div>
    );
  }
}
