import React, { Component } from 'react';

import './Footer.scss';

import Icon from 'components/Icon/Icon.js';
import InitService from 'services/InitService';
import Languages from 'services/languages/languages.js';
import Globals from 'services/Globals.js';
import Menu from 'components/Menus/Menu.js';

export default class Footer extends React.Component {
  constructor(props) {
    super();
    this.onpremise = !!((InitService.server_infos || {}).branding || {}).name;
    this.menu = [
      {
        type: 'menu',
        text: Languages.t('general.help.support', [], 'Support'),
        icon: 'comment',
        onClick: props.onClickHelp,
      },
      {
        type: 'menu',
        text: Languages.t('general.help.documentation', [], 'Documentation'),
        icon: 'book',
        onClick: props.onClickDocumentation,
      },
    ];
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
            <Menu menu={this.menu} className="options" position="top">
              <div className="help">
                <Icon type="question-circle" />
                {Languages.t('general.help', [], 'Help')}
              </div>
            </Menu>
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
              {((InitService.server_infos || {}).branding || {}).name} Server
            </div>
          )}
        </div>
      </div>
    );
  }
}
