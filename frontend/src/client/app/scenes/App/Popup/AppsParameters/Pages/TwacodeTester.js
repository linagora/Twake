import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import Collections from 'services/Collections/Collections.js';
import popupManager from 'services/popupManager/popupManager.js';
import workspaceService from 'services/workspaces/workspaces.js';
import workspacesUsers from 'services/workspaces/workspaces_users.js';
import Emojione from 'components/Emojione/Emojione.js';
import StepCounter from 'components/StepCounter/StepCounter.js';
import ButtonWithTimeout from 'components/Buttons/ButtonWithTimeout.js';
import Icon from 'components/Icon/Icon.js';
import Attribute from 'components/Parameters/Attribute.js';
import Menu from 'components/Menus/Menu.js';
import AddUser from 'scenes/App/Popup/AddUser/AddUser.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Api from 'services/api.js';
import AutoHeight from 'components/AutoHeight/AutoHeight.js';
import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import Twacode from 'components/Twacode/Twacode.js';
import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';

import './Pages.scss';

export default class TwacodeTester extends Component {
  constructor(props) {
    super();
    this.state = {
      content: '{}',
      logs: [],
      passives: {},
    };
  }

  onAction(type, id, passives, evt) {
    console.log(type, id, evt);

    //Button pressed
    if (type == 'interactive_action') {
      this.state.logs.push({
        date: new Date().toLocaleString(),
        content: Languages.t(
          'scenes.app.popup.appsparameters.pages.call_event_handlers',
          ['interactive_action', id, +JSON.stringify(passives)],
          "Gestionnaire d'événement d'appels de type $1 et d'événement '$2', avec les passifs : $3",
        ),
      });
      this.setState({});
    }
  }

  onPassiveChange(type, id, value) {
    this.state.passives[id] = value;
    this.setState({});
  }

  render() {
    return (
      <div className="apps">
        <div className="title">
          {Languages.t('scenes.app.popup.appsparameters.pages.title_tester', [], 'Testeur Twacode')}
        </div>

        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages._appareance_message_twakcode',
              [],
              "Testez l'apparence de vos messages Twacode",
            )}
          </div>

          <div className="smalltext">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.instruction_message_twakecode',
              [],
              'Commencez par écrire votre message sous le format JSON.',
            )}
          </div>

          <AutoHeight
            placeholder={'{JSON}'}
            className={
              this.state.display_json_error
                ? Languages.t('scenes.app.popup.appsparameters.pages.error_user_code', [], 'erreur')
                : Languages.t('scenes.app.popup.appsparameters.pages.ok_user_code', [], '')
            }
            onChange={evt => {
              try {
                var json = JSON.parse(evt.target.value);
                this.setState({
                  logs: [],
                  passives: {},
                  content: evt.target.value,
                  display_json_error: false,
                });
              } catch (e) {
                this.setState({ content: evt.target.value, display_json_error: true });
              }
            }}
          >
            {this.state.content}
          </AutoHeight>

          <br />
          <br />
        </div>
        <div className="group_section">
          <div className="message" style={{ width: '100%' }}>
            {this.state.display_json_error && (
              <span>
                {Languages.t(
                  'scenes.app.popup.appsparameters.pages.error_Json_Ttwakecode',
                  [],
                  'Il y a une erreur dans votre JSON.',
                )}
              </span>
            )}

            {!this.state.display_json_error && (
              <Twacode
                className="allow_selection"
                id={'tester'}
                content={JSON.parse(this.state.content)}
                isApp={true}
                onAction={(type, id, passives, evt) => this.onAction(type, id, passives, evt)}
                onPassiveChange={(type, id, value) => this.onPassiveChange(type, id, value)}
              />
            )}
          </div>
        </div>
        <div className="group_section">
          <div className="subtitle">
            {Languages.t(
              'scenes.app.popup.appsparameters.pages.message_data_next_event',
              [],
              'Données passives qui seront envoyées dans le prochain Événement',
            )}
          </div>

          {Object.keys(this.state.passives).map(key => {
            var value = this.state.passives[key];
            return (
              <div className="text">
                <b>{key}</b> {value}
              </div>
            );
          })}
        </div>
        <div className="group_section">
          <div className="subtitle">
            {Languages.t('scenes.app.popup.appsparameters.pages.event_subtitle', [], 'Événements')}
          </div>

          {this.state.logs.reverse().map(event => {
            return (
              <div className="log text">
                <b>{event.date}</b> {event.content}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
