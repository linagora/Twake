import React, { Component, useState } from 'react';

import Languages from 'app/features/global/services/languages-service';
import Collections from 'app/deprecated/CollectionsV1/Collections/Collections.js';
import workspaceService from 'app/deprecated/workspaces/workspaces.js';
import ButtonWithTimeout from 'components/buttons/button-with-timeout.js';
import AlertManager from 'app/features/global/services/alert-manager-service';
import Api from 'app/features/global/framework/api-service';
import Input from 'components/inputs/input.js';
import { useCurrentCompany } from 'app/features/companies/hooks/use-companies';

import './Pages.scss';

export default (props) => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({error:false, error_code:false});

  const [newApp, setNewApp] = useState({ new_app_name: '', new_app_code: '', app_group_name: '' });

  const {company} = useCurrentCompany()

  const convertToSimpleName = (value) => {
    value = value || '';
    value = value.toLocaleLowerCase();
    value = value.replace(/[^a-z0-9]/g, '_');
    value = value.replace(/_+/g, '_');
    value = value.replace(/^_+/g, '');
    return value;
  }

  const createApp = () => {
    AlertManager.confirm(() => {
      var name = newApp.new_app_name;
      var code = newApp.new_app_code;
      var app_group_name = newApp.new_app_group_name;

      setLoading(true)
      setError({error:false, error_code: false})

      var data = {
        name: name,
        code: code,
        app_group_name: app_group_name,
        workspace_id: workspaceService.currentWorkspaceId,
      };


      const postPayload = {
        is_default: true,
        company_id: company.id,
        identity: {
          code: "code",
          name: "name",
          icon: "icon",
          description: "description",
          website: "website",
          categories: [],
          compatibility: [],
        },
        api: {
          hooksUrl: "hooksUrl",
          allowedIps: "allowedIps",
        },
        access: {
          read: ["messages"],
          write: ["messages"],
          delete: ["messages"],
          hooks: ["messages"],
        },
        display: {
          twake: {
            version: 1,

            files: {
              editor: {
                preview_url: "string", //Open a preview inline (iframe)
                edition_url: "string", //Url to edit the file (full screen)
                extensions: [], //Main extensions app can read
                // if file was created by the app, then the app is able to edit with or without extension
                empty_files: [
                  {
                    url: "string", // "https://[...]/empty.docx";
                    filename: "string", // "Untitled.docx";
                    name: "string", // "Word Document";
                  },
                ],
              },
              actions: [
                //List of action that can apply on a file
                {
                  name: "string",
                  id: "string",
                },
              ],
            },

            //Chat plugin
            chat: {
              input: true,
              commands: [
                {
                  command: "string", // my_app mycommand
                  description: "string",
                },
              ],
              actions: [
                //List of action that can apply on a message
                {
                  name: "string",
                  id: "string",
                },
              ],
            },

            //Allow app to appear as a bot user in direct chat
            direct: false,

            //Display app as a standalone application in a tab
            tab: { url: "string" },

            //Display app as a standalone application on the left bar
            standalone: { url: "string" },

            //Define where the app can be configured from
            configuration: ["global", "channel"],
          },
        },
        publication: {
          requested: false, //Publication requested
        },
      };

      Api.post('/internal/services/applications/v1/applications', postPayload, res => {
        console.log(res.data)
        if (res.data && res.data.resource?.id) {
          setNewApp({ new_app_name: '', new_app_code: '', app_group_name: '' })

          Collections.get('applications').completeObject(res.data.resource);

          this.props.openApp(res.data.id);
        } else {
          setLoading(false);
          if (res.errors && res.errors.indexOf('code_used') >= 0) {
            setError({error: false, error_code: true})
          } else {
            setError({error: true, error_code: false})
          }
        }
      });
    });
  }


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
            disabled={loading}
            value={newApp.new_app_name}
            onChange={ev =>
              setNewApp({
                new_app_name: ev.target.value,
                new_app_code: newApp.new_app_code_modified
                  ? newApp.new_app_code
                  : convertToSimpleName(ev.target.value),
              })
            }
          />
          {error.error_code && (
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

          {error.error && (
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
            disabled={loading}
            onClick={() => {
              props.exit();
            }}
          />

          <ButtonWithTimeout
            className="small buttonValidation"
            value={Languages.t(
              'scenes.app.popup.appsparameters.pages.create_my_app',
              [],
              'Créer mon application',
            )}
            disabled={loading}
            loading={loading}
            onClick={() => {
              createApp();
            }}
          />
        </div>
      </div>
    );

}
