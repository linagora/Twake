import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import workspaceService from 'services/workspaces/workspaces.js';
import Emojione from 'components/Emojione/Emojione';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Attribute from 'components/Parameters/Attribute.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Api from 'services/api.js';
import WorkspaceAppsCreator from './WorkspaceAppsCreator.js';
import Switch from 'components/Inputs/Switch.js';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import Icon from 'components/Icon/Icon.js';
import InputWithClipBoard from 'components/InputWithClipBoard/InputWithClipBoard.js';
import Input from 'components/Inputs/Input.js';
import InlineTagPicker from 'app/components/InlineTagPicker/InlineTagPicker';

import './Pages.scss';
import WorkspacesApp from 'services/workspaces/workspaces_apps.js';
import WorkspaceApps from './WorkspaceApps.js';

export default class WorkspaceAppsEditor extends Component {
  constructor(props) {
    super();
    this.state = {
      id: props.appId,
      application: {},
      show_api_key: false,
    };
  }

  saveApp() {
    var saveApp = () => {
      this.setState({ loading: true, error: false, error_simple_name: false });

      var data = {
        application: this.state.application,
        workspace_id: workspaceService.currentWorkspaceId,
      };

      Api.post('market/app/update', data, res => {
        if (res.data && res.data.id) {
          Collections.get('applications').completeObject(res.data);

          this.props.exit();
        } else {
          if (res.errors.indexOf('simple_name_used') >= 0) {
            this.setState({ loading: false, error_simple_name: true });
          } else {
            this.setState({ loading: false, error: true });
          }
        }
      });
    };

    if (this.state.application.install_count > 0) {
      AlertManager.confirm(
        () => {
          saveApp();
        },
        null,
        {
          text: Languages.t(
            'scenes.app.popup.appsparameters.pages.app_update',
            [this.state.application.name, this.state.application.install_count || 0],
            "Mettre à jour l'application $1 (l'application est utilisée $2 fois.)",
          ),
        },
      );
    } else {
      saveApp();
    }
  }

  removeApp() {
    AlertManager.confirm(
      () => {
        this.setState({ loading: true, error: false });

        var data = {
          application_id: this.state.application.id,
        };

        Api.post('market/app/remove', data, res => {
          if (res.data && !res.errors.length) {
            Collections.get('applications').removeObject(this.state.application.front_id);
            this.props.exit();
          } else {
            this.setState({ loading: false, error: true });
          }
        });
      },
      null,
      {
        text: Languages.t(
          'scenes.app.popup.appsparameters.pages.remove_app',
          [this.state.application.name],
          "Supprimer l'application $1 définitivement.",
        ),
      },
    );
  }

  convertToSimpleName(value) {
    value = value || '';
    value = value.toLocaleLowerCase();
    value = value.replace(/[^a-z0-9]/g, '_');
    value = value.replace(/_+/g, '_');
    value = value.replace(/^_+/g, '');
    return value;
  }

  render() {
    if (this.state.application.id != this.state.id) {
      this.state.application = JSON.parse(
        JSON.stringify(Collections.get('applications').find(this.state.id) || {}),
      );
    }

    var isNew = false;
    var application = this.state.application;
    if (!application || !application.id) {
      isNew = true;
    }

    var workspace_id = workspaceService.currentWorkspaceId;
    var workspace = Collections.get('workspaces').find(workspace_id);
    var group = Collections.get('groups').find(workspace.group.id);

    if (isNew) {
      return (
        <WorkspaceAppsCreator exit={this.props.exit} openApp={id => this.setState({ id: id })} />
      );
    }

    var original_app = Collections.get('applications').find(this.state.id);

    var public_lock = original_app.public || original_app.is_available_to_public;

    return (
      <div className="fade_in app_editor">
        <div className="title">
          <Icon
            className="app_icon"
            style={{ fontSize: '24px' }}
            type={WorkspacesApp.getAppIcon(application)}
          />
          {application.name}
        </div>

        <div className="smalltext" style={{ opacity: 1 }}>
          <Emojione type={':exploding_head:'} /> If you do not know how to fill these, go to{' '}
          <a href="https://doc.twake.app" target="_blank">
            the Twake API documentation
          </a>{' '}
          !
        </div>

        {public_lock && (
          <div className="smalltext" style={{ opacity: 1 }}>
            <Emojione type={':warning:'} />{' '}
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.alert_published_app',
              [],
              'Votre application est publiée, vous ne pouvez pas la modifier.',
            )}
          </div>
        )}

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages._app_identity',
              [],
              "Identité de l'application",
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.modify_public_data',
              [],
              'Modifier les données publiques de votre application.',
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none' }}>
              <div className="label for_input">Nom</div>
              <Input
                placeholder={Languages.t(
                  'scenes.app.popup.appsparameters.pages.amazing_app_name',
                  [],
                  'My amazing app',
                )}
                type="text"
                disabled={this.state.loading || public_lock}
                value={application.name}
                onChange={ev => {
                  application.name = ev.target.value;
                  this.setState({});
                }}
              />

              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.grp_section_surname_label',
                  [],
                  'Nom simplifié',
                )}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.string_information',
                  [],
                  "Cette chaine de caractère permet d'identifier votre application et sera utilisée dans les commandes de message.",
                )}
              </div>
              <Input
                placeholder={'my_amazing_app'}
                type="text"
                disabled={this.state.loading || public_lock}
                value={application.simple_name}
                onChange={ev => {
                  var simple = this.convertToSimpleName(ev.target.value);
                  application.simple_name = simple;
                  this.setState({});
                }}
              />
              {this.state.error_simple_name && (
                <div className="smalltext error" style={{ opacity: 1 }}>
                  {Languages.t(
                    'scenes.app.popup.appsparameters.pages.grp_section_name-error',
                    [],
                    'Ce nom est déjà utilisé par une autre application, veuillez en choisir un autre.',
                  )}
                </div>
              )}

              <div className="label for_input">
                {Languages.t('scenes.app.popup.appsparameters.pages.icon', 'icon')}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.optimal_format',
                  [],
                  'Format optimal : 48x48px.',
                )}
              </div>
              <Input
                placeholder={'https://domain.com/my_icon.png'}
                type="text"
                disabled={this.state.loading || public_lock}
                value={application.icon_url}
                onChange={ev => {
                  application.icon_url = ev.target.value;
                  this.setState({});
                }}
              />
              <TagPicker
                disabled={this.state.loading || public_lock}
                canCreate={false}
                inline
                data={application.available_categories.map(item => {
                  return { name: item, id: item };
                })}
                value={(application.categories || []).map(item => {
                  return { name: item, id: item };
                })}
                onChange={values => {
                  application.categories = values.map(item => item.name);
                  this.setState({});
                }}
              />

              <div className="label for_input">
                {Languages.t('scenes.app.popup.appsparameters.pages.website_label', [], 'Site web')}
              </div>
              <Input
                placeholder={'https://domain.com/'}
                type="text"
                disabled={this.state.loading || public_lock}
                value={application.website}
                onChange={ev => {
                  application.website = ev.target.value;
                  this.setState({});
                }}
              />

              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.description_label',
                  [],
                  'Description',
                )}
              </div>
              <AutoHeight
                placeholder={Languages.t(
                  'scenes.app.popup.appsparameters.pages.description_label',
                  [],
                  'Description',
                )}
                disabled={this.state.loading || public_lock}
                onChange={evt => {
                  application.description = evt.target.value;
                  this.setState({});
                }}
              >
                {application.description}
              </AutoHeight>
            </div>
          </Attribute>
        </div>

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages.api_parameters_label',
              [],
              "Paramètres de l'API",
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.api_data_description',
              [],
              "Données utiles pour l'API Twake.",
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.public_login_label',
                  [],
                  'Identifiant public',
                )}
              </div>
              <InputWithClipBoard disabled={true} value={application.api_id} />

              <div className="label for_input">
                Private key{' '}
                <a
                  style={{ float: 'inherit' }}
                  onClick={() => {
                    clearTimeout(this.api_key_timeout || '');
                    this.setState({ show_api_key: true });
                    this.api_key_timeout = setTimeout(() => {
                      this.setState({ show_api_key: false });
                    }, 5000);
                  }}
                >
                  Show
                </a>
              </div>
              <InputWithClipBoard
                disabled={true}
                hideBtn={!this.state.show_api_key}
                value={this.state.show_api_key ? application.api_key : '••••••••••••••'}
              />

              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.url_reception_events_label',
                  [],
                  'Url de reception des évènements',
                )}
              </div>
              <Input
                placeholder={'https://domain.com/api/twake/events'}
                type="text"
                disabled={this.state.loading}
                value={application.api_event_url}
                onChange={ev => {
                  application.api_event_url = ev.target.value;
                  this.setState({});
                }}
              />

              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.autorised_ip_adresses_label',
                  [],
                  'Adresses IP autorisée',
                )}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.filter_information',
                  [],
                  "Ce filtre permet de limiter l'utilisation de votre clé API aux serveurs de votre connecteur uniquement.",
                )}
                <br />
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.allowed_ip_adresses_method',
                  [],
                  'Utilisez * en développement pour autorisé toutes les adresses IP.',
                )}
              </div>
              <Input
                placeholder={'ip1, ip2, ip3'}
                type="text"
                disabled={this.state.loading}
                value={application.api_allowed_ips}
                onChange={ev => {
                  application.api_allowed_ips = ev.target.value;
                  this.setState({});
                }}
              />
            </div>
          </Attribute>
        </div>

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages.displayed_parameters_label',
              [],
              "Paramètres d'affichage",
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.dispalyed_parameters_description',
              [],
              "Permet de définir l'endroit où votre application sera visible.",
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 0 }}>
              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.configuration_label',
                  [],
                  'Configuration',
                )}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0, opacity: 1 }}>
                <Emojione type={':information_source:'} />{' '}
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.json_configuration_information',
                  [],
                  'Rendez-vous sur la documentation afin de générer votre configuration au format JSON.',
                )}
              </div>
              <AutoHeight
                placeholder={'{JSON}'}
                className={this.state.display_json_error ? 'error' : ''}
                disabled={this.state.loading || public_lock}
                onChange={evt => {
                  try {
                    application.display = JSON.parse(evt.target.value);
                    this.setState({ display_json_error: false });
                  } catch (e) {
                    application.display = evt.target.value;
                    this.setState({ display_json_error: true });
                  }
                }}
              >
                {typeof application.display == 'object'
                  ? JSON.stringify(application.display, null, 2)
                  : application.display}
              </AutoHeight>
            </div>
          </Attribute>
        </div>

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages.app_privileges_label',
              [],
              "Privilèges de l'application",
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.app_privileges_information',
              [],
              'Permet de définir ce que votre application peut modifier et lire.',
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 0 }}>
              <div className="label for_input" style={{ marginBottom: 5 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.write_privileges_label',
                  [],
                  'Privilèges en écriture',
                )}
              </div>
              <InlineTagPicker
                available={application.available_capabilities}
                value={application.capabilities}
                onChange={items => {
                  application.capabilities = items;
                  this.setState({});
                }}
              />
              <div className="label for_input" style={{ marginBottom: 5 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.read_privileges_label',
                  [],
                  'Privilèges en lecture',
                )}
              </div>
              <InlineTagPicker
                available={application.available_privileges}
                value={application.privileges}
                onChange={items => {
                  application.privileges = items;
                  this.setState({});
                }}
              />
              <div className="label for_input" style={{ marginBottom: 5 }}>
                Hooks
              </div>
              <InlineTagPicker
                available={application.available_hooks}
                value={application.hooks}
                onChange={items => {
                  application.hooks = items;
                  this.setState({});
                }}
              />
            </div>
          </Attribute>
        </div>

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages.publication_label',
              [],
              'Publication',
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.publication_description',
              [],
              'Déterminez la visibilité de votre application.',
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="smalltext" style={{ paddingTop: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.parameters_form_small_text',
                  [],
                  "L'application non publiée ne fonctionnera que dans votre entreprise, si vous souhaitez la rendre disponible à tous les utilisateurs de Twake activez cette option.",
                )}
              </div>

              {original_app.public && !original_app.is_available_to_public && (
                <div className="smalltext" style={{ paddingTop: 0, opacity: 1 }}>
                  <Emojione type={':information_source:'} />{' '}
                  {Languages.t(
                    'scenes.app.popup.appsparameters.pages.available_publication_alert',
                    [],
                    'La publication de votre application est actuellement en attente de validation par les équipes de Twake.',
                  )}
                </div>
              )}

              <Switch
                label={Languages.t(
                  'scenes.app.popup.appsparameters.pages.publish_app_label',
                  [],
                  "Publier l'application",
                )}
                value={application.public}
                onChange={value => {
                  application.public = value;
                  this.setState({});
                }}
              />
            </div>
          </Attribute>
        </div>

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages.danger_zone_label',
              [],
              'Zone dangereuse',
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.danger_zone_description',
              [],
              "Supprimez l'application.",
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="smalltext" style={{ padding: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.danger_zone_small_text',
                  [],
                  'Vous ne pouvez pas supprimer cette application si elle est publiée.',
                )}
              </div>

              <ButtonWithTimeout
                className="small buttonValidation danger"
                value={Languages.t(
                  'scenes.app.popup.appsparameters.pages.remove_app_button',
                  [],
                  "Supprimer l'application",
                )}
                disabled={this.state.loading || public_lock}
                loading={this.state.loading}
                onClick={() => {
                  this.removeApp();
                }}
              />
            </div>
          </Attribute>
        </div>
        <div className="group_section">
          {this.state.error_simple_name && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_app_simple_name_message',
                [],
                'Le nom simplifié de votre application est déjà utilisé par une autre application, veuillez le changer.',
              )}
            </div>
          )}

          {this.state.error && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_app_update_message',
                [],
                "Une erreur s'est produite lors de la mise à jour de l'application.",
              )}
            </div>
          )}

          <ButtonWithTimeout
            className="small buttonGoBack secondary"
            value={Languages.t('general.back', [], 'Retour')}
            disabled={this.state.loading}
            onClick={() => {
              this.props.exit();
            }}
          />

          <ButtonWithTimeout
            className="small buttonValidation"
            value={Languages.t(
              'scenes.app.popup.appsparameters.pages.update_button',
              [],
              'Mettre à jour',
            )}
            disabled={this.state.loading}
            loading={this.state.loading}
            onClick={() => {
              this.saveApp();
            }}
          />
        </div>
      </div>
    );
  }
}
