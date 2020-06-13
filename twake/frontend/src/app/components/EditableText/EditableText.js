import React, {Component} from 'react';
import './EditableText.scss';

import Input from 'components/Inputs/Input.js';

export default class EditableText extends React.Component {
  constructor(props) {
    super();
    this.props = props;

    this.state = {
      value: '#FF0000',
    };
  }
  render() {
    return (
      <div className="color_input big">
        <Input
          value={this.state.value}
          onChange={evt => this.setState({ value: evt.target.value })}
        />
        <div className="color_square" style={{ backgroundColor: this.state.value }} />
      </div>
    );
  }
}
