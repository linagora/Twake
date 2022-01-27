import React, { Component } from 'react';

import './inputs.scss';
import CheckIcon from '@material-ui/icons/CheckOutlined';

export default class Checkbox extends React.Component {
  constructor(props) {
    super();
  }
  renderSwitch() {
    var className = this.props.className || '';

    if (this.props.big) {
      className += ' big ';
    }
    if (this.props.medium) {
      className += ' medium ';
    }
    if (this.props.small) {
      className += ' small ';
    }

    if (
      className.indexOf('medium') === className.indexOf('small') &&
      className.indexOf('big') === className.indexOf('small') &&
      className.indexOf('big') < 0
    ) {
      className += ' medium';
    }

    return (
      <div
        className={
          'checkbox ' +
          (this.props.value ? 'on' : 'off') +
          ' ' +
          (this.props.disabled ? 'disabled' : '') +
          ' ' +
          (className || '')
        }
        onClick={() => {
          if (!this.props.label && !this.props.disabled) {
            this.props.onChange(!this.props.value);
          }
        }}
      >
        <div className="state">
          <CheckIcon className="m-icon-small" />
        </div>
      </div>
    );
  }
  render() {
    var parentClassName = '';

    if (this.props.big) {
      parentClassName += ' big ';
    }
    if (this.props.medium) {
      parentClassName += ' medium ';
    }
    if (this.props.small) {
      parentClassName += ' small ';
    }

    if (
      parentClassName.indexOf('medium') === parentClassName.indexOf('small') &&
      parentClassName.indexOf('big') === parentClassName.indexOf('small') &&
      parentClassName.indexOf('big') < 0
    ) {
      parentClassName += ' medium';
    }

    if (this.props.label) {
      return (
        <div
          className={'checkbox_with_label ' + (this.props.value ? 'on ' : 'off ') + parentClassName}
          onClick={() => {
            if (!this.props.disabled) {
              this.props.onChange(!this.props.value);
            }
          }}
        >
          {this.renderSwitch()}
          <div className="label">{this.props.label}</div>
        </div>
      );
    } else {
      return this.renderSwitch();
    }
  }
}
