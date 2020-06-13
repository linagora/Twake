import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import Tutorial from 'components/Leftbar/Tutorial/Tutorial.js'
import Emojione from "components/Emojione/Emojione.js";

var stories = storiesOf('Left bar|Tutorials', module);
stories.addDecorator(withKnobs);

stories
.add('some tutorial', () => (
  <Tutorial title={["Welcome to Twake ", <Emojione type=":stars:" />]} subtitle={"Devenez un pro de Twake en seulement quelques clics !"}
  blocks={[
    {
      text: "Choisir un prénom",
      emoji: ":man_astronaut:",
    },
    {
      text: "Envoyer un premier message dans une discussion",
      emoji: ":love_letter:",
      done: true
    }
  ]}
  />
));
