<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import hljs from 'highlight.js';
import 'highlight.js/styles/railscasts.css'; //monokai-sublime

export default class HighlightedCode extends React.Component {
  componentDidMount() {
    hljs.highlightBlock(this.node);
    window.hljs = hljs;
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
