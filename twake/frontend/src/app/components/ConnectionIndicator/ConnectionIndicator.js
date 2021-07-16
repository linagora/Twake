import React, { Component } from 'react';
import './ConnectionIndicator.scss';
import WebsocketsManager from 'services/websocket.js';
import ErrorOutlinedIcon from '@material-ui/icons/ErrorOutlined';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Languages from 'services/languages/languages';

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
          'connection_indicator ' + (WebsocketsManager.connected === false ? 'visible' : '')
        }
      >
        {WebsocketsManager.connected === false && WebsocketsManager.is_reconnecting !== true && (
          <div>
            <ErrorOutlinedIcon />{' '}
            <span>{Languages.t('general.connexion_status.disconnected')}</span>
          </div>
        )}
        {WebsocketsManager.connected === false && WebsocketsManager.is_reconnecting === true && (
          <div>
            <HourglassEmpty /> <span>{Languages.t('general.connexion_status.connecting')}</span>
          </div>
        )}
        {WebsocketsManager.connected === true && (
          <div>
            <CheckCircleIcon /> <span>{Languages.t('general.connexion_status.connected')}</span>
          </div>
        )}
      </div>
    );
  }
}
