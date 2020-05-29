import React from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import Button from 'components/Buttons/Button.js'

import EditableText from 'components/EditableText/EditableText.js'

storiesOf('Intro|Test', module).add(
  'to Storybook', () => <div className="section">
    <EditableText value="#FF0000" onChange={(value)=>{}} />
  </div>
);
