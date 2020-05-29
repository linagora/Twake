import React, {Component} from 'react';

import './Workspace.scss';

import Icon from 'components/Icon/Icon.js';

export default class WorkspaceAdd extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    var workspace = this.props.workspace || {};
    return (
      <div className="workspace workspaceadd" onClick={this.props.onClick}>
        <div className="image">
          <Icon type="plus" />
        </div>
      </div>
    );
  }
}
