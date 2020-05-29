import React, { Component } from 'react';

import './Footer.scss';

import Icon from 'components/Icon/Icon.js';
import LoginService from 'services/login/login.js';
import GroupSwitch from 'components/Leftbar/GroupSwitch/GroupSwitch.js';

export default class Footer extends React.Component {
  constructor(props) {
    super();

    this.onpremise = !!((LoginService.server_infos || {}).branding || {}).name;
  }
  componentDidMount() {
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
      Headway.init(config);
    }
  }
  render() {
    return (
      <div className="channel_footer">
        <div className="line_2">
          {this.props.onClickHelp && (
            <div className="help" onClick={this.props.onClickHelp}>
              <Icon type="question-circle" />
              Help
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
