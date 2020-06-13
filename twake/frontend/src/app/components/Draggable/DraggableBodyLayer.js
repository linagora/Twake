import React, {Component} from 'react';

import DraggableManager from './DraggableManager.js';

export default class DraggableBodyLayer extends React.Component {
  constructor(props) {
    super();
    this.state = {
      draggable_manager: DraggableManager,
    };
    this.draggable_body_dom = null;
    DraggableManager.addListener(this);
  }
  componentDidMount() {
    DraggableManager.registerContainer(this.draggable_body_dom);
  }
  render() {
    return <div ref={node => (this.draggable_body_dom = node)} />;
  }
}
