import React from 'react';
import ReactDOM from 'react-dom';

import App from 'scenes/app.js';
import Integration from 'scenes/Integration/integration.js';
<<<<<<< HEAD
=======
import registerServiceWorker from './registerServiceWorker';
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
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
<<<<<<< HEAD
  Sentry.init({
    dsn: window.sentry_dsn,
  });
}

export default class RootApp extends React.Component {
  render() {
    return (
      <Integration>
        <App key="root" />
      </Integration>
    );
  }
}
=======
  Sentry.init({ dsn: window.sentry_dsn });
}

ReactDOM.render(
  <Integration>
    <App key="root" />
  </Integration>,
  document.getElementById('app'),
);
registerServiceWorker();
>>>>>>> 9a2d09a38ed3114eba780cb02f4bac4cddc5334a
