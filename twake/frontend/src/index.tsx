/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/app';
import * as serviceWorker from './serviceWorker';
import './tailwind.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(<App />, );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
