import React, { Component } from 'react';
import Icon from 'components/Icon/Icon.js';
import './Alert.scss';
import AlertManager from 'services/AlertManager/AlertManager.js';
import CloseIcon from '@material-ui/icons/CloseOutlined';

export default class PopupComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      AlertManager: AlertManager,
    };
    AlertManager.addListener(this);
  }
  componentWillUnmount() {
    AlertManager.removeListener(this);
  }
  componentDidMount() {
    document.addEventListener('keydown', this.eventClose);
  }
  componentWillUnmount() {
    document.removeEventListener('keydown', this.eventClose);
  }
  eventClose(evt) {
    if (evt.keyCode == 27) {
      AlertManager.closeAlert();
    }
    if (evt.keyCode == 13) {
      AlertManager.confirmAlert();
    }
  }
  render() {
    if (this.state.AlertManager.isOpen()) {
      return (
        <div className="alertComponent fade_in">
          <div className="alertContainer">
            <div className="component">{this.state.AlertManager.getComponent()}</div>
          </div>
        </div>
      );
    }
    return '';
  }
}
