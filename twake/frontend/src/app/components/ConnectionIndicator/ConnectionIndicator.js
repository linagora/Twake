import React, { Component } from 'react';
import './ConnectionIndicator.scss';
import WebsocketsManager from 'services/websocket.js';
import ErrorOutlinedIcon from '@material-ui/icons/ErrorOutlined';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

export default class ConnectionIndicator extends React.Component {
  constructor(props) {
    super(props);
    WebsocketsManager.addListener(this);
  }
  componentWillUnmount() {
    WebsocketsManager.removeListener(this);
  }
  render() {
    return (
      <div
        className={
          'connection_indicator fade_in ' + (WebsocketsManager.connected === false ? 'visible' : '')
        }
      >
        {WebsocketsManager.connected === false && WebsocketsManager.is_reconnecting !== true && (
          <div>
            <ErrorOutlinedIcon /> <span>Vous êtes hors ligne</span>
          </div>
        )}
        {WebsocketsManager.connected === false && WebsocketsManager.is_reconnecting === true && (
          <div>
            <HourglassEmpty /> <span>Reconnexion en cours...</span>
          </div>
        )}
        {WebsocketsManager.connected === true && (
          <div>
            <CheckCircleIcon /> <span>Vous êtes connecté</span>
          </div>
        )}
      </div>
    );
  }
}
