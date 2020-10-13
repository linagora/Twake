import React, { Component } from 'react';

import './Footer.scss';

import Icon from 'components/Icon/Icon.js';
import LoginService from 'services/login/login.js';
import Languages from 'services/languages/languages.js';
import Globals from 'services/Globals.js';

export default class Footer extends React.Component {
  constructor(props) {
    super();

    this.onpremise = !!((LoginService.server_infos || {}).branding || {}).name;
  }
  componentDidMount() {
    try {
      if (!this.onpremise) {
        var config = {
          selector: '#changelog_text',
          account: '7L9kKJ',
          translations: {
            title: 'Twake Changelog',
            readMore: 'Read more',
            footer: 'View more changes',
          },
        };
        if (typeof Globals.window?.Headway != 'undefined') {
          Globals.window.Headway.init(config);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
  render() {
    return (
      <div className="channel_footer">
        <div className="line_2">
          {this.props.onClickHelp && (
            <div className="help" onClick={this.props.onClickHelp}>
              <Icon type="question-circle" />
              {Languages.t('general.help', [], 'Help')}
            </div>
          )}
          {!this.onpremise && (
            <div
              className="help"
              style={{ textAlign: 'right', flex: 1, position: 'relative' }}
              id="changelog_text"
            >
              Changelog
            </div>
          )}
          {this.onpremise && (
            <div className={'plan'}>
              {((LoginService.server_infos || {}).branding || {}).name} Server
            </div>
          )}
        </div>
      </div>
    );
  }
}
