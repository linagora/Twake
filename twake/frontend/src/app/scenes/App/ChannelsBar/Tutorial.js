import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import WorkspaceUserRights from 'services/workspaces/workspace_user_rights.js';
import Emojione from 'components/Emojione/Emojione';
import UserService from 'services/user/user.js';
import CurrentUserService from 'services/user/current_user.js';
import ElectronService from 'services/electron/electron.js';
import AlertManager from 'services/AlertManager/AlertManager.js';

import Workspaces from 'services/workspaces/workspaces.js';
import Collections from 'services/Collections/Collections.js';
import WorkspaceParameter from 'scenes/App/Popup/WorkspaceParameter/WorkspaceParameter.js';
import WorkspacesUsers from 'services/workspaces/workspaces_users.js';
import UserParameter from 'scenes/App/Popup/UserParameter/UserParameter.js';
import popupManager from 'services/popupManager/popupManager.js';

import TutorialUI from 'components/Leftbar/Tutorial/Tutorial.js';

import Globals from 'services/Globals.js';

export default class Tutorial extends Component {
  constructor() {
    super();

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
    Collections.get('users').addListener(this);
    Collections.get('users').listenOnly(this, [UserService.getCurrentUser().front_id]);
  }
  componentWillUnmount() {
    Languages.removeListener(this);
    Collections.get('users').removeListener(this);
  }
  componentDidMount() {
    if (ElectronService.isElectron()) {
      CurrentUserService.updateTutorialStatus('has_desktop_app');
    }
  }
  removeTuto(tuto, evt) {
    evt.stopPropagation();
    evt.preventDefault();
    AlertManager.confirm(
      () => {
        CurrentUserService.updateTutorialStatus(tuto);
      },
      () => {},
      {
        text: Languages.t(
          'scenes.app.channelsbar.tutorial_alert',
          [],
          'Ne plus jamais afficher ce cadre ?',
        ),
      },
    );
  }
  render() {
    var tutorial_status = UserService.getCurrentUser().tutorial_status || {};
    var group = Collections.get('groups').find(Workspaces.currentGroupId);

    if (
      WorkspaceUserRights.hasWorkspacePrivilege() &&
      Object.keys(WorkspacesUsers.getUsersByWorkspace(Workspaces.currentWorkspaceId) || {}).length >
        1
    ) {
      CurrentUserService.updateTutorialStatus('did_invite_collaborators');
    }

    if (
      ['openid', 'cas'].indexOf(CurrentUserService.get().identity_provider) >= 0 &&
      !tutorial_status.no_tuto
    ) {
      CurrentUserService.updateTutorialStatus('no_tuto');
      tutorial_status.no_tuto = true;
    }

    return (
      <div className="left_tutorials">
        {WorkspaceUserRights.isInvite() && !tutorial_status.no_invite && false && (
          <TutorialUI
            title={[
              Languages.t(
                'scenes.app.channelsbar.company_invitation_alert_title',
                [],
                "Vous êtes invité dans l'entreprise ",
              ),
              <b>{group.name}</b>,
            ]}
            subtitle={
              true
                ? ''
                : Languages.t(
                    'scenes.app.channelsbar.company_invitation_alert_subtitle',
                    [],
                    'Vous pouvez importer ces chaînes dans votre entreprise pour rester organisé en cliquant sur ce cadre.',
                  )
            }
            onClickFrame={e => {
              /*window.open("https://twakeapp.com/")*/
            }}
            onClose={e => this.removeTuto('no_invite', e)}
          />
        )}

        {!WorkspaceUserRights.isInvite() && !tutorial_status.no_tuto && (
          <TutorialUI
            title={[
              Languages.t('scenes.app.channelsbar.welcome', [], 'Bienvenue sur Twake'),
              <Emojione type=":stars:" />,
            ]}
            subtitle={Languages.t(
              'scenes.app.channelsbar.welcoming_message_subtitle',
              [],
              'Devenez un pro de Twake en seulement quelques clics !',
            )}
            blocks={[
              {
                text: Languages.t(
                  'scenes.app.channelsbar.initial_instructions_tutorial',
                  [],
                  'Choisissez un prénom, un nom et une image de profil.',
                ),
                emoji: ':woman_juggling:',
                done: tutorial_status.has_identity,
                onClick: () => {
                  popupManager.open(<UserParameter />);
                },
              },
              {
                text: Languages.t(
                  'scenes.app.channelsbar.sending_message_instruction',
                  [],
                  'Envoyer un premier message dans une discussion',
                ),
                emoji: ':love_letter:',
                done: tutorial_status.first_message_sent,
              },
              /*{
              text: "Installer l'application mobile",
              emoji: ":iphone:",
              done: tutorial_status.has_mobile_app,
              onClick: ()=>{ Globals.window.open("https://twakeapp.com/download") }
            },*/
              {
                text: Languages.t(
                  'scenes.app.channelsbar.installation_desktop_tutorial',
                  [],
                  "Installer l'application desktop",
                ),
                emoji: ':desktop:',
                done: tutorial_status.has_desktop_app,
                onClick: () => {
                  Globals.window.open('https://twakeapp.com/download');
                },
              },
              {
                text: Languages.t(
                  'scenes.app.channelsbar.invitation_collaboraors_tutorial',
                  [],
                  'Invitez vos collaborateurs dans votre espace de travail.',
                ),
                emoji: ':handshake:',
                done: tutorial_status.did_invite_collaborators,
                onClick: () => {
                  popupManager.open(
                    <WorkspaceParameter initial_page={2} />,
                    true,
                    'workspace_parameters',
                  );
                },
              },
            ]}
            onClose={e => this.removeTuto('no_tuto', e)}
          />
        )}
      </div>
    );
  }
}
