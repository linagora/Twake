<<<<<<< HEAD
import React, { Component } from 'react';
=======
import React, {Component} from 'react';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a

import PlusIcon from '@material-ui/icons/AddOutlined';

export default class Rounded extends React.Component {
  constructor(props) {
    super();
  }
  render() {
    return (
      <div
        style={this.props.style}
        className={'rounded-btn ' + this.props.className}
        onClick={this.props.onClick}
      >
        {this.props.text ? this.props.text + ' ' : ''}
        <PlusIcon className="m-icon-small" />
      </div>
    );
  }
}
