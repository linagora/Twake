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
import Attribute from 'components/Parameters/Attribute.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Api from 'services/api.js';
import WorkspaceAppsCreator from './WorkspaceAppsCreator.js';
import Switch from 'components/Inputs/Switch.js';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import TagPicker from 'components/TagPicker/TagPicker.js';
import InputWithClipBoard from 'components/InputWithClipBoard/InputWithClipBoard.js';
import Input from 'components/Inputs/Input.js';

import './Pages.scss';

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
<<<<<<< HEAD
            "Mettre à jour l'application $1 (application est utilisée $2 fois.)"
          ),
        }
=======
            "Mettre à jour l'application $1 (application est utilisée $2 fois.)",
          ),
        },
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
          "Supprimer l'application $1 définitivement."
        ),
      }
=======
          "Supprimer l'application $1 définitivement.",
        ),
      },
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
        JSON.stringify(Collections.get('applications').find(this.state.id) || {})
=======
        JSON.stringify(Collections.get('applications').find(this.state.id) || {}),
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
          <div
            className="app_icon"
            style={{
              backgroundImage:
                'url(' + (application.icon_url || '/public/img/default_app_icon.png') + ')',
            }}
          />
          {application.name}
        </div>

        <div className="smalltext" style={{ opacity: 1 }}>
          <Emojione type={':exploding_head:'} /> If you do not know how to fill these, go to{' '}
          <a href="https://twakeapp.com" target="_blank">
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
<<<<<<< HEAD
              'Votre application est publiée, vous ne pouvez pas la modifier.'
=======
              'Votre application est publiée, vous ne pouvez pas la modifier.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          </div>
        )}

        <div className="group_section">
          <Attribute
            label={Languages.t(
              'scenes.app.popup.appsparameters.pages._app_identity',
              [],
<<<<<<< HEAD
              "Identité de l'application"
=======
              "Identité de l'application",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.modify_public_data',
              [],
<<<<<<< HEAD
              'Modifier les données publiques de votre application.'
=======
              'Modifier les données publiques de votre application.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none' }}>
              <div className="label for_input">Nom</div>
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
<<<<<<< HEAD
                  'Nom simplifié'
=======
                  'Nom simplifié',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.string_information',
                  [],
<<<<<<< HEAD
                  "Cette chaine de caractère permet d'identifier votre application et sera utilisée dans les commandes de message."
=======
                  "Cette chaine de caractère permet d'identifier votre application et sera utilisée dans les commandes de message.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
                    'Ce nom est déjà utilisé par une autre application, veuillez en choisir un autre.'
=======
                    'Ce nom est déjà utilisé par une autre application, veuillez en choisir un autre.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  )}
                </div>
              )}

              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.app_grp_label',
                  [],
<<<<<<< HEAD
                  "Groupe d'applications"
=======
                  "Groupe d'applications",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <Input type="text" disabled={true} value={application.app_group_name} />

              <div className="label for_input">Icône</div>
              <div className="smalltext" style={{ paddingBottom: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.optimal_format',
                  [],
<<<<<<< HEAD
                  'Format optimal : 48x48px.'
=======
                  'Format optimal : 48x48px.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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

              <div className="label for_input" style={{ marginBottom: 5 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.categories_label',
                  [],
<<<<<<< HEAD
                  'Catégories'
=======
                  'Catégories',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
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
<<<<<<< HEAD
                  'Description'
=======
                  'Description',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <AutoHeight
                placeholder={Languages.t(
                  'scenes.app.popup.appsparameters.pages.description_label',
                  [],
<<<<<<< HEAD
                  'Description'
=======
                  'Description',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
              "Paramètres de l'API"
=======
              "Paramètres de l'API",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.api_data_description',
              [],
<<<<<<< HEAD
              "Données utiles pour l'API Twake."
=======
              "Données utiles pour l'API Twake.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.public_login_label',
                  [],
<<<<<<< HEAD
                  'Identifiant public'
=======
                  'Identifiant public',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
                  'Url de reception des évènements'
=======
                  'Url de reception des évènements',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
                  'Adresses IP autorisée'
=======
                  'Adresses IP autorisée',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.filter_information',
                  [],
<<<<<<< HEAD
                  "Ce filtre permet de limiter l'utilisation de votre clé API aux serveurs de votre connecteur uniquement."
=======
                  "Ce filtre permet de limiter l'utilisation de votre clé API aux serveurs de votre connecteur uniquement.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
                <br />
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.allowed_ip_adresses_method',
                  [],
<<<<<<< HEAD
                  'Utilisez * en développement pour autorisé toutes les adresses IP.'
=======
                  'Utilisez * en développement pour autorisé toutes les adresses IP.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
              "Paramètres d'affichage"
=======
              "Paramètres d'affichage",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.dispalyed_parameters_description',
              [],
<<<<<<< HEAD
              "Permet de définir l'endroit où votre application sera visible."
=======
              "Permet de définir l'endroit où votre application sera visible.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 0 }}>
              <div className="label for_input">
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.configuration_label',
                  [],
<<<<<<< HEAD
                  'Configuration'
=======
                  'Configuration',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <div className="smalltext" style={{ paddingBottom: 0, opacity: 1 }}>
                <Emojione type={':information_source:'} />{' '}
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.json_configuration_information',
                  [],
<<<<<<< HEAD
                  'Rendez-vous sur la documentation afin de générer votre configuration au format JSON.'
=======
                  'Rendez-vous sur la documentation afin de générer votre configuration au format JSON.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
              "Privilèges de l'application"
=======
              "Privilèges de l'application",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.app_privileges_information',
              [],
<<<<<<< HEAD
              'Permet de définir ce que votre application peut modifier et lire.'
=======
              'Permet de définir ce que votre application peut modifier et lire.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 0 }}>
              <div className="label for_input" style={{ marginBottom: 5 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.write_privileges_label',
                  [],
<<<<<<< HEAD
                  'Privilèges en écriture'
=======
                  'Privilèges en écriture',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <TagPicker
                canCreate={false}
                disabled={this.state.loading || public_lock}
                data={application.available_capabilities.map(item => {
                  return { name: item.id || item, id: item.id || item };
                })}
                value={(application.capabilities || []).map(item => {
                  return { name: item.id || item, id: item.id || item };
                })}
                onChange={values => {
                  application.capabilities = values.map(item =>
<<<<<<< HEAD
                    typeof item == 'string' ? item : item.id
=======
                    typeof item == 'string' ? item : item.id,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  );
                  this.setState({});
                }}
              />

              <div className="label for_input" style={{ marginBottom: 5 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.read_privileges_label',
                  [],
<<<<<<< HEAD
                  'Privilèges en lecture'
=======
                  'Privilèges en lecture',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>
              <TagPicker
                canCreate={false}
                disabled={this.state.loading || public_lock}
                data={application.available_privileges.map(item => {
                  return { name: item.id || item, id: item.id || item };
                })}
                value={(application.privileges || []).map(item => {
                  return { name: item.id || item, id: item.id || item };
                })}
                onChange={values => {
                  application.privileges = values.map(item =>
<<<<<<< HEAD
                    typeof item == 'string' ? item : item.id
=======
                    typeof item == 'string' ? item : item.id,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  );
                  this.setState({});
                }}
              />

              <div className="label for_input" style={{ marginBottom: 5 }}>
                Hooks
              </div>
              <TagPicker
                canCreate={false}
                disabled={this.state.loading || public_lock}
                data={application.available_hooks.map(item => {
                  return { name: item.id || item, id: item.id || item };
                })}
                value={(application.hooks || []).map(item => {
                  return { name: item.id || item, id: item.id || item };
                })}
                onChange={values => {
                  application.hooks = values.map(item =>
<<<<<<< HEAD
                    typeof item == 'string' ? item : item.id
=======
                    typeof item == 'string' ? item : item.id,
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  );
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
<<<<<<< HEAD
              'Publication'
=======
              'Publication',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.publication_description',
              [],
<<<<<<< HEAD
              'Déterminez la visibilité de votre application.'
=======
              'Déterminez la visibilité de votre application.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="smalltext" style={{ paddingTop: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.parameters_form_small_text',
                  [],
<<<<<<< HEAD
                  "L'application non publiée ne fonctionnera que dans votre entreprise, si vous souhaitez la rendre disponible à tous les utilisateurs de Twake activez cette option."
=======
                  "L'application non publiée ne fonctionnera que dans votre entreprise, si vous souhaitez la rendre disponible à tous les utilisateurs de Twake activez cette option.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>

              {original_app.public && !original_app.is_available_to_public && (
                <div className="smalltext" style={{ paddingTop: 0, opacity: 1 }}>
                  <Emojione type={':information_source:'} />{' '}
                  {Languages.t(
                    'scenes.app.popup.appsparameters.pages.available_publication_alert',
                    [],
<<<<<<< HEAD
                    'La publication de votre application est actuellement en attente de validation par les équipes de Twake.'
=======
                    'La publication de votre application est actuellement en attente de validation par les équipes de Twake.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                  )}
                </div>
              )}

              <Switch
                label={Languages.t(
                  'scenes.app.popup.appsparameters.pages.publish_app_label',
                  [],
<<<<<<< HEAD
                  "Publier l'application"
=======
                  "Publier l'application",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
              'Zone dangereuse'
=======
              'Zone dangereuse',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
            description={Languages.t(
              'scenes.app.popup.appsparameters.pages.danger_zone_description',
              [],
<<<<<<< HEAD
              "Supprimez l'application."
=======
              "Supprimez l'application.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
            )}
          >
            <div className="parameters_form" style={{ maxWidth: 'none', paddingTop: 10 }}>
              <div className="smalltext" style={{ padding: 0 }}>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.danger_zone_small_text',
                  [],
<<<<<<< HEAD
                  'Vous ne pouvez pas supprimer cette application si elle est publiée.'
=======
                  'Vous ne pouvez pas supprimer cette application si elle est publiée.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
                )}
              </div>

              <ButtonWithTimeout
                className="small buttonValidation danger"
                value={Languages.t(
                  'scenes.app.popup.appsparameters.pages.remove_app_button',
                  [],
<<<<<<< HEAD
                  "Supprimer l'application"
=======
                  "Supprimer l'application",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
                'Le nom simplifié de votre application est déjà utilisé par une autre application, veuillez le changer.'
=======
                'Le nom simplifié de votre application est déjà utilisé par une autre application, veuillez le changer.',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>
          )}

          {this.state.error && (
            <div className="smalltext error" style={{ opacity: 1 }}>
              {Languages.t(
                'scenes.app.popup.appsparameters.pages.error_app_update_message',
                [],
<<<<<<< HEAD
                "Une erreur s'est produite lors de la mise à jour de l'application."
=======
                "Une erreur s'est produite lors de la mise à jour de l'application.",
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
              )}
            </div>
          )}

          <ButtonWithTimeout
            className="small buttonGoBack secondary"
            value={Languages.t('scenes.app.popup.appsparameters.pages.back_button', [], 'Retour')}
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
<<<<<<< HEAD
              'Mettre à jour'
=======
              'Mettre à jour',
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
