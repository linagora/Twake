import React from 'react';
import ReactDOM from 'react-dom';

import App from 'scenes/app.js';
import Integration from 'scenes/Integration/integration.js';
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

if (process.env.NODE_ENV === 'production' && window.sentry_dsn) {
  Sentry.init({ dsn: window.sentry_dsn });
}

ReactDOM.render(
  <Integration>
    <App key="root" />
  </Integration>,
  document.getElementById('app'),
);
registerServiceWorker();
