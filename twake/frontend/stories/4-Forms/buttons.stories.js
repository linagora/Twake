import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import Button from 'components/Buttons/Button.js';

const stories = storiesOf('Forms|Buttons', module);
stories.addDecorator(withKnobs);

stories
  .add('buttons', () => (
    <ComponentDoc title="Buttons" import="import Button from 'components/Buttons/Button.js'"
    properties={[
      ["big", "boolean", "false", "Set button to big size (64px)"],
      ["medium", "boolean", "true", "Set button to medium size (40px)"],
      ["small", "boolean", "false", "Set button to small size (32px)"],
      ["disabled", "boolean", "false", "Disable button"],
    ]}
    infos={"-"}
    >
      <div className="">
        <Button className="big bottom-margin">Proceed</Button><br/>
        <Button className="medium bottom-margin">Proceed</Button><br/>
        <Button className="small bottom-margin right-margin">Proceed</Button>
        <Button className="small bottom-margin" disabled>Proceed</Button><br/>
        <Button className="small secondary bottom-margin right-margin">Proceed</Button>
        <Button className="small secondary bottom-margin" disabled>Proceed</Button><br/>
        <Button className="small secondary-light bottom-margin right-margin">Proceed</Button>
        <Button className="small secondary-light bottom-margin" disabled>Proceed</Button><br/>
        <Button className="small danger bottom-margin right-margin">Proceed</Button>
        <Button className="small danger bottom-margin" disabled>Proceed</Button>

      </div>
    </ComponentDoc>
  ));
