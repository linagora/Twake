<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import Languages from 'services/languages/languages.js';
import './InputWithClipBoard.scss';
import Icon from 'components/Icon/Icon.js';
import Tooltip from 'components/Tooltip/Tooltip.js';
import Input from 'components/Inputs/Input.js';

export default class InputWithClipBoard extends Component {
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
  componentWillUnmount() {
    Languages.removeListener(this);
  }
  selectAll() {
    this.inputElement.focus();
    this.inputElement.select();
  }
  copy() {
    this.inputElement.disabled = false;
    this.inputElement.focus();
    this.inputElement.select();
    document.execCommand('copy');
    this.inputElement.disabled = this.props.disabled;
    this.tooltip.openWithTimeOut(2);
  }
  render() {
    return (
<<<<<<< HEAD
      <Tooltip
        ref={obj => (this.tooltip = obj)}
        overable={false}
        tooltip={Languages.t('components.input.copied', [], 'Copié')}
      >
=======
      <Tooltip ref={obj => (this.tooltip = obj)} overable={false} tooltip={Languages.t('components.input.copied', [], "Copié")}>
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
        <div className="inputWithClipBoard">
          <Input
            className="medium full_width"
            refInput={obj => (this.inputElement = obj)}
            onClick={() => this.selectAll()}
            {...this.props}
          />
          {!this.props.hideBtn && (
            <div className="button copy" onClick={() => this.copy()}>
              <Icon type="copy" />
            </div>
          )}
        </div>
      </Tooltip>
    );
  }
}
