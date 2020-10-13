import React, { Component } from 'react';

import './Tutorial.scss';

import Icon from 'components/Icon/Icon.js';
import Emojione from 'components/Emojione/Emojione';

export default class Tutorial extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    return (
      <div className="tutorial" onClick={this.props.onClickFrame}>
        <div
          className="close"
          onClick={evt => {
            evt.preventDefault();
            evt.stopPropagation();
            this.props.onClose && this.props.onClose(evt);
          }}
        >
          <Icon type="multiply" />
        </div>

        {this.props.title && <div className="small_title">{this.props.title}</div>}
        {this.props.subtitle && <div className="small_subtitle">{this.props.subtitle}</div>}

        {this.props.blocks && this.props.blocks.length > 0 && (
          <div className="body">
            {(this.props.blocks || [])
              .sort((a, b) => (a.done ? 1 : -1))
              .map((item, i) => {
                return (
                  <div
                    key={'bloc_' + i}
                    className={
                      'block ' + (item.done ? 'done ' : '') + (item.onClick ? 'hoverable ' : '')
                    }
                    onClick={item.onClick}
                  >
                    {(item.emoji || item.done) && (
                      <div className="icon">
                        <Emojione type={item.done ? ':white_check_mark:' : item.emoji} />
                      </div>
                    )}
                    <div className="text">{item.text}</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  }
}
