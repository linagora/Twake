<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
import Icon from 'components/Icon/Icon.js';
import Menu from 'components/Menus/Menu.js';
import './MainPlus.scss';

export default class MainPlus extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    if (this.props.onClick) {
      return (
        <div className="main_plus_button" onClick={this.props.onClick}>
          <Icon type="plus" className="m-icon-small" />
        </div>
      );
    }
    return (
      <Menu menu={this.props.menu} className="main_plus_button" position={'top'}>
        <Icon type="plus" className="m-icon-small" />
      </Menu>
    );
  }
}
