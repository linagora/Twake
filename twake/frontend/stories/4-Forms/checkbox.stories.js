import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { withState } from '@dump247/storybook-state';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import Input from 'components/Inputs/Input.js'
import Button from 'components/Buttons/Button.js'
import Checkbox from 'components/Inputs/Checkbox.js'
import Switch from 'components/Inputs/Switch.js'
import Radio from 'components/Inputs/Radio.js'
import InputWithColor from 'components/Inputs/InputWithColor.js'
import InputWithIcon from 'components/Inputs/InputWithIcon.js'

import StepCounter from 'components/StepCounter/StepCounter.js';

const stories = storiesOf('Forms|Checkbox', module);
stories.addDecorator(withKnobs);

stories
  .add('checkbox inputs', withState({ input: true })(({ store }) => (
    <ComponentDoc title="Checkbox" import="import Checkbox from 'components/Inputs/Checkbox.js'"
    properties={[
      ["big", "boolean", "false", "Set button to big size (64px)"],
      ["medium", "boolean", "true", "Set button to medium size (40px)"],
      ["small", "boolean", "false", "Set button to small size (32px)"],
      ["disabled", "boolean", "false", "Disable button"],
      ["label", "string", "", "Show clickable label beside checkbox"],
    ]}
    infos={"-"}
    >

      <Checkbox big className="bottom-margin" value={store.state.input} onChange={(value)=>store.set({input: value})} /><br/>
      <Checkbox medium className="bottom-margin" value={!store.state.input} onChange={(value)=>store.set({input: !value})} /><br/>
      <Checkbox small className="bottom-margin" disabled value={store.state.input} onChange={(value)=>store.set({input: value})} /><br/>

      <Checkbox label="With label" big className="bottom-margin" value={store.state.input} onChange={(value)=>store.set({input: value})} /><br/>
      <Checkbox label="With label" medium className="bottom-margin" value={!store.state.input} onChange={(value)=>store.set({input: !value})} /><br/>
      <Checkbox label="With label" small className="" disabled value={store.state.input} onChange={(value)=>store.set({input: value})} /><br/>

    </ComponentDoc>
  )));
