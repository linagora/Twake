import React from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

storiesOf('Intro|Welcome', module).add(
  'to Storybook', () => <div className="section">
    <div className="title">
      Welcome to you !
    </div>
    <div className="subtitle">
      This is the Storybook of Twake !
    </div>
    <div className="text">
      This is a unfinished welcome page.
    </div>
  </div>,
  {notes: 'A very simple example of addon notes'});
