import React, { Component } from 'react';

import Loader from 'components/Loader/Loader.js';
import './Buttons.scss';

export default class Button extends React.Component {
  render() {
    var that = this;
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
      className += ' small';
    }
    return (
      <button ref={this.props.refButton} {...this.props} className={'button ' + className}>
        {this.props.value || this.props.children}
      </button>
    );
  }
}
