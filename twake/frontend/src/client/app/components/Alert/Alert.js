import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione.js';
import Languages from 'services/languages/languages.js';
import AlertManager from 'services/AlertManager/AlertManager.js';
import Input from 'components/Inputs/Input.js';
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
          {this.props.title && <div className="title">{this.props.title}</div>}
          {this.props.text && <div className="subtitle">{this.props.text}</div>}
        </div>
        <div className="bottom">
          <Button
            className="medium"
            value="Close"
            onClick={() => this.state.AlertManager.confirmAlert()}
          />
        </div>
      </div>
    );
  }
}
