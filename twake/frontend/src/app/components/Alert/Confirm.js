import React, {Component} from 'react';
import Languages from 'services/languages/languages.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Button from 'components/Buttons/Button.js';
import './Alert.scss';

export default class Confirm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      i18n: Languages,
      AlertManager: AlertManager,
    };
    AlertManager.addListener(this);
    Languages.addListener(this);
  }
  componentWillUnmount() {
    AlertManager.removeListener(this);
    Languages.removeListener(this);
  }
  render() {
    return (
      <div className="confirmAlert">
        <div className="content">
          <div className="title">{this.props.title || Languages.t('components.alert.confirm', [], 'Confirm your action')}</div>
          <div className="subtitle">
            {this.props.text || Languages.t('components.alert.confirm_click', [], 'Confirmez votre action en cliquant sur Confirmer.')}
          </div>
        </div>
        <div className="bottom">
          <Button
            className="medium secondary right-margin"
            value={Languages.t('general.cancel', [], "Cancel")}
            onClick={() => {
              this.state.AlertManager.closeAlert();
            }}
          />
          <Button
            className="medium"
            value={Languages.t('general.confirm', [], "Confirm")}
            onClick={() => this.state.AlertManager.confirmAlert()}
          />
        </div>
      </div>
    );
  }
}
