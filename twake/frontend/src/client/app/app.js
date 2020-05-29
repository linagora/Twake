import React from 'react';
import ReactDOM from 'react-dom';

import App from 'scenes/app.js';
import registerServiceWorker from './registerServiceWorker';
import $ from 'jquery';
import * as Sentry from '@sentry/browser';

window.jQuery = $;
window.$ = $;

window.getBoundingClientRect = element => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    x: rect.x || rect.left,
    y: rect.y || rect.top,
  };
};

if (process.env.NODE_ENV !== 'production') {
  //const {whyDidYouUpdate} = require('why-did-you-update');
  //whyDidYouUpdate(React);
} else {
  Sentry.init({ dsn: 'https://9a4c141c0b284164aa1c3c69def20812@sentry.io/1775858' });
}

ReactDOM.render(<App key="root" />, document.getElementById('app'));
registerServiceWorker();
