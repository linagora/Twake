import React, { Component } from 'react';

import Languages from 'services/languages/languages.js';
import './InputWithButton.scss';
import Icon from 'components/Icon/Icon.js';
import Input from './Input.js';

export default class InputWithButton extends Component {
  /*
        props = {
            value : "",
            disabled : true|false
        }
    */
  constructor(props) {
    super(props);
    this.props = props;

    this.state = {
      i18n: Languages,
    };

    Languages.addListener(this);
    this.inputElement = false;
  }

  render() {
    return (
      <div className="inputWithButton">
        <Input
          className="medium full_width"
          refInput={obj => {
            this.inputElement = obj;
            this.props.refInput && this.props.refInput();
          }}
          {...this.props}
        />
        {!this.props.hideBtn && (
          <div
            className={'button button-icon ' + (this.props.color ? this.props.color : '')}
            onClick={() => this.props.btnAction()}
          >
            <Icon type={this.props.icon} />
          </div>
        )}
      </div>
    );
  }
}
