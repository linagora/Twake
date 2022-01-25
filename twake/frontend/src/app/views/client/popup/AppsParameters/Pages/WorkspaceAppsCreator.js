import React, { Component } from 'react';

import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import workspaceService from 'app/deprecated/workspaces/workspaces.js';
import ButtonWithTimeout from 'components/buttons/button-with-timeout.js';
import AlertManager from 'app/features/global/services/alert-manager-service';
import Api from 'app/features/global/services/api-service';
import Input from 'components/inputs/input.js';

import './Pages.scss';

export default class WorkspaceAppsCreator extends Component {
  constructor(props) {
    super();
    this.state = {
      loading: false,
    };
  }

  convertToSimpleName(value) {
    value = value || '';
    value = value.toLocaleLowerCase();
    value = value.replace(/[^a-z0-9]/g, '_');
    value = value.replace(/_+/g, '_');
    value = value.replace(/^_+/g, '');
    return value;
  }

  createApp() {
    AlertManager.confirm(() => {
      var name = this.state.new_app_name;
      var code = this.state.new_app_code;
      var app_group_name = this.state.new_app_group_name;

      this.setState({ loading: true, error: false, error_code: false });

      var data = {
        name: name,
        code: code,
        app_group_name: app_group_name,
        workspace_id: workspaceService.currentWorkspaceId,
      };

      Api.post('/ajax/market/app/create', data, res => {
        if (res.data && res.data.id) {
          this.setState({ new_app_name: '', new_app_code: '', app_group_name: '' });

          Collections.get('applications').completeObject(res.data);

          this.props.openApp(res.data.id);
        } else {
          if (res.errors.indexOf('code_used') >= 0) {
            this.setState({ loading: false, error_code: true });
          } else {
            this.setState({ loading: false, error: true });
          }
        }
      });
    });
  }

  render() {
    var workspace_id = workspaceService.currentWorkspaceId;
    var workspace = Collections.get('workspaces').find(workspace_id);
    var group = Collections.get('groups').find(workspace?.group?.id || workspace.company_id);

    return (
      <div className="fade_in app_editor">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.appsparameters.pages.new_app_title',
            [],
            'Nouvelle application',
          )}
        </div>

        <div className="group_section">
          <div className="label for_input">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.app_name_label',
              'Application name',
            )}
          </div>
          <Input
            className="full_width"
            placeholder={Languages.t(
              'scenes.app.popup.appsparameters.pages.amazing_app_name',
              [],
              'My amazing app',
            )}
            type="text"
            disabled={this.state.loading}
            value={this.state.new_app_name}
            onChange={ev =>
              this.setState({
                new_app_name: ev.target.value,
                new_app_code: this.state.new_app_code_modified
                  ? this.state.new_app_code
                  : this.convertToSimpleName(ev.target.value),
              })
            }
          />
          {this.state.error_code && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_message',
                [],
                'Ce nom est déjà utilisé par une autre application, veuillez en choisir un autre.',
              )}
            </div>
          )}
        </div>
        <div className="group_section">
          <div className="label for_input">
            {Languages.t('scenes.app.popup.appsparameters.pages.company_label')}
          </div>
          <div className="smalltext" style={{ paddingBottom: 0 }}>
            {Languages.t('scenes.app.popup.appsparameters.pages.app_modification_right')}
          </div>
          <Input className="full_width" type="text" value={group.name} disabled />

          <br />
          <br />

          {this.state.error && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_check_needed',
                [],
                'Une erreur est survenue, vérifiez vos informations.',
              )}
            </div>
          )}

          <ButtonWithTimeout
            className="small buttonGoBack secondary"
            value={Languages.t('scenes.app.popup.appsparameters.pages.go_back', [], 'Retour')}
            disabled={this.state.loading}
            onClick={() => {
              this.props.exit();
            }}
          />

          <ButtonWithTimeout
            className="small buttonValidation"
            value={Languages.t(
              'scenes.app.popup.appsparameters.pages.create_my_app',
              [],
              'Créer mon application',
            )}
            disabled={this.state.loading}
            loading={this.state.loading}
            onClick={() => {
              this.createApp();
            }}
          />
        </div>
      </div>
    );
  }
}
