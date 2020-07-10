<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import AutoHeight from 'components/AutoHeight/AutoHeight.js';

import './Inputs.scss';

export default class Input extends React.Component {
  constructor(props) {
    super();
  }
  onKeyDown(evt) {
    if (evt.keyCode == 13 && this.props.onEnter) {
      this.props.onEnter();
    }
    if (evt.keyCode == 27 && this.props.onEchap) {
      this.props.onEchap();
    }
  }
  componentDidMount() {
    if (this.props.autoFocus && this.node) {
      this.node.focus();
    }
  }
  render() {
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

    if (this.props.autoHeight) {
      return (
        <AutoHeight
          refInput={node => {
            this.node = node;
            this.props.refInput && this.props.refInput(node);
          }}
          {...this.props}
          onKeyDown={evt => {
            if (this.props.onKeyDown) {
              this.props.onKeyDown(evt);
            }
            this.onKeyDown(evt);
          }}
          className={'input ' + (className || '')}
        />
      );
    }

    return (
      <input
        ref={node => {
          this.node = node;
          this.props.refInput && this.props.refInput(node);
        }}
        {...this.props}
        onKeyDown={evt => {
          if (this.props.onKeyDown) {
            this.props.onKeyDown(evt);
          }
          this.onKeyDown(evt);
        }}
        className={'input ' + (className || '')}
      />
    );
  }
}
