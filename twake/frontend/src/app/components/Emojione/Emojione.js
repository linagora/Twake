import React, {Component} from 'react';

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

    if (this.props.s64) {
      html = html.replace('/32/', '/64/');
    } else if (this.props.s128) {
      html = html.replace('/32/', '/128/');
    }

    return (
      <i
        className={'emojione-container ' + (this.props.className || '')}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
}
