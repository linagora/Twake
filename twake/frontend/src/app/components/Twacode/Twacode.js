import React, { Component } from 'react';

import PseudoMarkdownCompiler from 'services/Twacode/pseudoMarkdownCompiler.js';
import './Twacode.scss';

export default class Twacode extends React.Component {
  constructor(props) {
    super();
    this.container = null;
    this.state = {
      loading_interaction: false,
    };
    this.passives = {};
  }

  componentWillUnmount() {
    clearTimeout(this.loading_interaction_timeout);
  }

  onAction(type, id, context, value, evt) {
    //Button pressed
    if (type == 'interactive_action') {
      if (this.props.onAction) {
        this.setState({ loading_interaction: true });
        clearTimeout(this.loading_interaction_timeout);
        this.loading_interaction_timeout = setTimeout(() => {
          this.saved_stringified = '';
          this.setState({ loading_interaction: false });
        }, 5000);
        this.props.onAction(type, id, context, JSON.parse(JSON.stringify(this.passives)), evt);
      }
    }

    //Input changed
    if (type == 'interactive_change') {
      this.passives[id] = value;
      if (this.props.onPassiveChange) {
        this.props.onPassiveChange(type, id, context, value);
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    var stringified = JSON.stringify([nextProps.content, nextProps.before, nextProps.after]);
    if (stringified != this.saved_stringified) {
      clearTimeout(this.loading_interaction_timeout);
      nextState.loading_interaction = false;
      this.saved_stringified = stringified;
      return true;
    }
    return nextState.loading_interaction;
  }

  render() {
    return (
      <div
        ref={node => (this.container = node)}
        {...this.props}
        content=""
        className={
          'markdown ' +
          (this.state.loading_interaction ? 'loading_interaction ' : '') +
          this.props.className
        }
      >
        {this.props.before || ''}
        {PseudoMarkdownCompiler.compileToHTML(this.props.content, true || this.props.isApp, this)}
        {this.props.after || ''}
      </div>
    );
  }
}
