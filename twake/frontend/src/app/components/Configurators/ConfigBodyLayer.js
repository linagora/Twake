import React, { Component } from 'react';

import ConfiguratorsManager from 'services/Configurators/ConfiguratorsManager.js';
import Twacode from 'components/Twacode/Twacode';
import WorkspacesApps from 'services/workspaces/workspaces_apps.js';
import CloseIcon from '@material-ui/icons/CloseOutlined';
import './Configurators.scss';

/*
  Where the configurators will be displayed, this component should be in app.js (menus should be over all elements of the page)
*/
export default class ConfigBodyLayer extends React.Component {
  constructor(props) {
    super();
    this.state = {};
    ConfiguratorsManager.addListener(this);
  }
  componentWillUnmount() {
    ConfiguratorsManager.removeListener(this);
    clearTimeout(this.loading_interaction_timeout);
  }
  componentWillMount() {
    this.generateData();
  }
  shouldComponentUpdate(nextProps, nextState) {
    this.generateData();
    var string = JSON.stringify(this.configurator);
    if (string != this.saved) {
      nextState.loading_interaction = false;
      clearTimeout(this.loading_interaction_timeout);
      this.saved = string;
      return true;
    }
    return nextState.loading_interaction ? true : false;
  }
  generateData() {
    if (ConfiguratorsManager.configurator_order.length == 0) {
      this.configurator = null;
    }
    this.configurator =
      ConfiguratorsManager.currentConfigurators[
        ConfiguratorsManager.configurator_order[ConfiguratorsManager.configurator_order.length - 1]
      ];
  }
  onAction(type, id, context, passives, evt) {
    if (type == 'interactive_action') {
      this.setState({ loading_interaction: true });
      clearTimeout(this.loading_interaction_timeout);
      this.loading_interaction_timeout = setTimeout(() => {
        this.setState({ loading_interaction: false });
      }, 5000);
      var app_id = this.configurator.app.id;
      var type = 'interactive_configuration_action';
      var event = id;
      var data = {
        interactive_context: context,
        form: passives,
        hidden_data: this.configurator.hidden_data,
      };
      WorkspacesApps.notifyApp(app_id, type, event, data);
    }
  }
  render() {
    if (!this.configurator) {
      return '';
    }

    return (
      <div>
        <div
          className={
            'config_modal fade_in ' + (this.state.loading_interaction ? 'loading_interaction ' : '')
          }
        >
          <div className="modal">
            <div
              className="component"
              style={{
                height: this.configurator.hidden_data.height || 'auto',
                width: this.configurator.hidden_data.width || '500px',
                maxWidth: '90vw',
                maxHeight: '90vh',
              }}
            >
              <div className="header">
                <div
                  className="app_logo"
                  style={{ backgroundImage: 'url(' + this.configurator.app.icon_url + ')' }}
                />
                <div className="app_name">{this.configurator.app.name}</div>

                <CloseIcon
                  className="m-icon-medium close"
                  onClick={() => {
                    ConfiguratorsManager.closeConfigurator(this.configurator.app);
                  }}
                />
              </div>
              <div className="content">
                <Twacode
                  className="allow_selection"
                  id={'configurator'}
                  content={this.configurator.form}
                  isApp={true}
                  onAction={(type, id, context, passives, evt) =>
                    this.onAction(type, id, context, passives, evt)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
