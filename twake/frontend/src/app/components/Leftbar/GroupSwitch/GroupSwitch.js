import React, {Component} from 'react';

import './GroupSwitch.scss';

export default class GroupSwitch extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    var group = this.props.group || {};
    return (
      <div
        ref={this.props.refDiv}
        className={'group_switch ' + (this.props.imageOnly ? 'image_only' : '')}
        onClick={this.props.onClick}
      >
        <div
          ref={this.props.refLogo}
          className={'current_company_logo ' + (group.logo ? 'has_image ' : '')}
          style={{ backgroundImage: "url('" + window.addApiUrlIfNeeded(group.logo) + "')" }}
        >
          {((group.mininame || group.name || '') + '-')[0].toUpperCase()}
          {this.props.notifications > 0 && <div className="notification_dot" />}
        </div>
        <div className="company_name">{group.mininame || (group.name || '').substr(0, 6)}</div>
      </div>
    );
  }
}
