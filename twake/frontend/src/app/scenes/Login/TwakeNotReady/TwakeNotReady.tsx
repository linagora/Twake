import React, { Component } from 'react';

import Emojione from 'components/Emojione/Emojione';
import LoginService from 'services/login/login.js';

import Languages from 'services/languages/languages.js';
import popupManager from 'services/popupManager/popupManager.js';

import './TwakeNotReady.scss';

type Props = {
  ready:
    | {
        elasticsearch_connection: boolean;
        elasticsearch_mapping: boolean;
        db_connection: boolean;
        db_mapping: boolean;
        init: boolean;
      }
    | true;
};

export default class TwakeNotReady extends Component<Props> {
  render() {
    let status = '(1/4) Starting backend...';
    let comment = '';

    if (typeof this.props.ready === 'object') {
      if (!this.props.ready.db_connection) {
        status = '(2/4) Waiting for DB to start...';
      } else if (!this.props.ready.db_mapping) {
        status = '(2/4) Initialize DB...';
      } else if (!this.props.ready.elasticsearch_connection) {
        status = '(3/4) Waiting for ES to start...';
        comment =
          "(if you don't use ES, remove the key es.host in php parameters and restart the server)";
      } else if (!this.props.ready.elasticsearch_mapping) {
        status = '(3/4) Initialize ES...';
        comment =
          "(if you don't use ES, remove the key es.host in php parameters and restart the server)";
      } else if (!this.props.ready.init) {
        status = '(4/4) Initialize connectors and default data...';
      } else {
        status = 'Almost done...';
      }
    }
    return (
      <div className="centered-twake-not-ready-page">
        <div className="twake-not-ready-page">
          <div className=" skew_in_top_nobounce">
            <div className="">
              <div className="title">
                <Emojione type=":partying_face:" s64 /> {'Twake is waking up!'}
              </div>
              <div className="subtitle">
                {
                  "Twake is not ready yet, it could take up to 10 minutes, we'll reload this page when everything is up. "
                }
                <Emojione type=":thumbsup: " />
              </div>
              <div className="subtitle">
                {'Go get a coffee in the meanwhile. '}
                <Emojione type=":coffee: " />
              </div>
              <div className="text" style={{ height: 60 }}>
                {status}
                <br />
                {comment}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
