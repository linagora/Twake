import React, { Component } from 'react';
import 'emoji-mart/css/emoji-mart.css';

import { getEmojiDataFromNative, Emoji } from 'emoji-mart';
import data from 'emoji-mart/data/all.json';

import emojione from 'emojione';
import Icon from 'components/Icon/Icon.js';

import './Emojione.scss';

export default class Emojione extends React.Component {
  constructor(props) {
    super();
  }
  shouldComponentUpdate(nextProps) {
    if (
      nextProps.type != this.props.type ||
      nextProps.s64 != this.props.s64 ||
      nextProps.s128 != this.props.s128
    ) {
      return true;
    }
    return false;
  }
  render() {
    if (typeof this.props.type != 'string') {
      return '';
    }

    if (this.props.type == 'trash') {
      return <Icon type="trash" className="trash_emoji" />;
    }

    if (this.props.type.substr(0, 7) == ':twake-') {
      return (
        <i
          className={'emojione emoji-image ' + (this.props.className || '')}
          style={{
            backgroundImage:
              "url('/public/img/twake-emoji/" + this.props.type.replace(/:/g, '') + ".png')",
          }}
        />
      );
    }

    if (this.props.type.substr(0, 7) == 'http://' || this.props.type.substr(0, 8) == 'https://') {
      return (
        <i
          className={'emojione emoji-image ' + (this.props.className || '')}
          style={{ backgroundImage: "url('" + this.props.type + "')" }}
        />
      );
    }

    //Use from local server
    var html = emojione.toImage(this.props.type);
    html = html.replace('https://cdn.jsdelivr.net/emojione/assets/3.1/png/', '/public/emojione/');

    let size = this.props.size || 16;
    if (this.props.s64) {
      size = 32;
      html = html.replace('/32/', '/64/');
    } else if (this.props.s128) {
      size = 64;
      html = html.replace('/32/', '/128/');
    }

    const uni = getEmojiDataFromNative(emojione.shortnameToUnicode(this.props.type), 'apple', data);

    const fb = (
      <i
        className={'emoji-container ' + (this.props.className || '')}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

    if (size > 32) {
      return fb;
    }

    return (
      <span className={'emoji-container emoji-text ' + (this.props.className || '')}>
        <Emoji emoji={uni || this.props.type} set="apple" size={size} fallback={() => fb} />
      </span>
    );
  }
}
