import React, { Component } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/railscasts.css'; //monokai-sublime

export default class HighlightedCode extends React.Component {
  componentDidMount() {
    window.hljs = hljs;
    hljs.highlightElement(this.node);
  }
  render() {
    var code = this.props.children;

    var min = 1000;
    code = code.replace(/\t/g, '  ');
    code.split('\n').forEach(line => {
      if (min > 0 && line.trim()) {
        min = Math.min(min, line.replace(/^( +).*/, '$1').length);
      }
    });

    if (min > 0) {
      code = code.replace(new RegExp('^ {' + min + '}', 'gm'), '');
    }

    return (
      <pre className={this.props.className}>
        <code ref={node => (this.node = node)}>{code}</code>
      </pre>
    );
  }
}
