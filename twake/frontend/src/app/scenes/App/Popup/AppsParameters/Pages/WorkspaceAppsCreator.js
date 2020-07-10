<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import workspaceService from 'services/workspaces/workspaces.js';
import Emojione from 'components/Emojione/Emojione.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Api from 'services/api.js';
import Input from 'components/Inputs/Input.js';

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
      var simple_name = this.state.new_app_simple_name;
      var app_group_name = this.state.new_app_group_name;

      this.setState({ loading: true, error: false, error_simple_name: false });

      var data = {
        name: name,
        simple_name: simple_name,
        app_group_name: app_group_name,
        workspace_id: workspaceService.currentWorkspaceId,
      };

      Api.post('market/app/create', data, res => {
        if (res.data && res.data.id) {
          this.state.new_app_name = '';
          this.state.new_app_simple_name = '';
          this.state.new_app_group_name = '';

          Collections.get('applications').completeObject(res.data);

          this.props.openApp(res.data.id);
        } else {
          if (res.errors.indexOf('simple_name_used') >= 0) {
            this.setState({ loading: false, error_simple_name: true });
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
    var group = Collections.get('groups').find(workspace.group.id);

    return (
      <div className="fade_in app_editor">
        <div className="title">
          {Languages.t(
            'scenes.app.popup.appsparameters.pages.new_app_title',
            [],
<<<<<<< HEAD
            'Nouvelle application'
=======
            'Nouvelle application',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
          )}
        </div>

        <div className="group_section">
          <div className="smalltext" style={{ opacity: 1 }}>
            <Emojione type=":clipboard:" />{' '}
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.creation_app_instruction',
              [],
<<<<<<< HEAD
              'Veuillez confirmer les informations suivantes avant de créer votre application.'
=======
              'Veuillez confirmer les informations suivantes avant de créer votre application.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>

          <div className="label for_input">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.app_name_label',
              [],
<<<<<<< HEAD
              'Nom de votre application'
=======
              'Nom de votre application',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <Input
            placeholder={Languages.t(
              'scenes.app.popup.appsparameters.pages.amazing_app_name',
              [],
<<<<<<< HEAD
              'My amazing app'
=======
              'My amazing app',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            type="text"
            disabled={this.state.loading}
            value={this.state.new_app_name}
            onChange={ev =>
              this.setState({
                new_app_name: ev.target.value,
                new_app_simple_name: this.state.new_app_simple_name_modified
                  ? this.state.new_app_simple_name
                  : this.convertToSimpleName(ev.target.value),
              })
            }
          />

          <div className="label for_input">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.app_surname',
              [],
<<<<<<< HEAD
              'Nom simplifié de votre application'
=======
              'Nom simplifié de votre application',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <div className="smalltext" style={{ paddingBottom: 0 }}>
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.app_informations',
              [],
<<<<<<< HEAD
              "Cette chaine de caractère permet d'identifier votre application et sera utilisée dans les commandes de message."
=======
              "Cette chaine de caractère permet d'identifier votre application et sera utilisée dans les commandes de message.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <Input
            placeholder={Languages.t(
              'scenes.app.popup.appsparameters.pages.amazing_app_name',
              [],
<<<<<<< HEAD
              'my_amazing_app'
=======
              'my_amazing_app',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            type="text"
            disabled={this.state.loading}
            value={this.state.new_app_simple_name}
            onChange={ev => {
              var simple = this.convertToSimpleName(ev.target.value);
              this.state.new_app_simple_name_modified =
                simple != this.convertToSimpleName(this.state.new_app_name);
              this.setState({ new_app_simple_name: simple });
            }}
          />
          {this.state.error_simple_name && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_message',
                [],
<<<<<<< HEAD
                'Ce nom est déjà utilisé par une autre application, veuillez en choisir un autre.'
=======
                'Ce nom est déjà utilisé par une autre application, veuillez en choisir un autre.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>
          )}
        </div>
        <div className="group_section">
          <div className="label for_input">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.company_label',
              [],
<<<<<<< HEAD
              'Entreprise propriétaire'
=======
              'Entreprise propriétaire',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <div className="smalltext" style={{ paddingBottom: 0 }}>
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.app_modification_right',
              [],
<<<<<<< HEAD
              'Tous les gérants de cette entreprise pourront modifier cette application.'
=======
              'Tous les gérants de cette entreprise pourront modifier cette application.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <Input type="text" value={group.name} disabled />

          <div className="label for_input">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.user_grp_app',
              [],
<<<<<<< HEAD
              "Groupe d'applications (laisser vide si non utilisé)"
=======
              "Groupe d'applications (laisser vide si non utilisé)",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.information_grp_of_app',
              [],
<<<<<<< HEAD
              "Cette chaine de caractère permet de grouper cette application avec d'autres applications du même type."
=======
              "Cette chaine de caractère permet de grouper cette application avec d'autres applications du même type.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            <br />
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.divided_connector',
              [],
<<<<<<< HEAD
              'Si votre connecteur se divise en plusieurs modules optionnels, créez une application par module et regroupez les grâce à ce champ.'
=======
              'Si votre connecteur se divise en plusieurs modules optionnels, créez une application par module et regroupez les grâce à ce champ.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            <br />
          </div>
          <div className="smalltext" style={{ opacity: 1, padding: 0 }}>
            <Emojione type=":warning:" />{' '}
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.warning_futur_modification',
              [],
<<<<<<< HEAD
              'Attention, ce champ ne peut pas être modifié ultérieurement.'
=======
              'Attention, ce champ ne peut pas être modifié ultérieurement.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
          <Input
            placeholder="my_amazing_group"
            type="text"
            disabled={this.state.loading}
            value={this.state.new_app_group_name}
            onChange={ev =>
              this.setState({ new_app_group_name: this.convertToSimpleName(ev.target.value) })
            }
          />

          <br />
          <br />

          {this.state.error && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_check_needed',
                [],
<<<<<<< HEAD
                'Une erreur est survenue, vérifiez vos informations.'
=======
                'Une erreur est survenue, vérifiez vos informations.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
              'Créer mon application'
=======
              'Créer mon application',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
