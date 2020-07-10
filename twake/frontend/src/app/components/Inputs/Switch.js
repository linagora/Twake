<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import './Inputs.scss';

export default class Switch extends React.Component {
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
          'switch ' +
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
        <div className="state" />
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
          className={
            'switch_with_label ' +
            (this.props.value ? 'on' : 'off') +
            ' ' +
            (this.props.disabled ? 'disabled' : '') +
            ' ' +
            parentClassName
          }
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
