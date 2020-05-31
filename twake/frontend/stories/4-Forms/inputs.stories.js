import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { withState } from '@dump247/storybook-state';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import Input from 'components/Inputs/Input.js'
import InputIcon from 'components/Inputs/InputIcon.js'
import Button from 'components/Buttons/Button.js'
import Checkbox from 'components/Inputs/Checkbox.js'
import Switch from 'components/Inputs/Switch.js'
import Radio from 'components/Inputs/Radio.js'
import InputWithColor from 'components/Inputs/InputWithColor.js'
import InputWithIcon from 'components/Inputs/InputWithIcon.js'

import StepCounter from 'components/StepCounter/StepCounter.js';

const stories = storiesOf('Forms|Inputs', module);
stories.addDecorator(withKnobs);

stories
  .add('normal', withState({ input: "Hello !" })(({ store }) => (
    <ComponentDoc title="Input" import="import Input from 'components/Inputs/Input.js'"
    properties={[
      ["big", "boolean", "false", "Set button to big size (64px)"],
      ["medium", "boolean", "true", "Set button to medium size (40px)"],
      ["small", "boolean", "false", "Set button to small size (32px)"],
      ["disabled", "boolean", "false", "Disable button"],
    ]}
    infos={"-"}
    >

      <Input big className="bottom-margin" value={store.state.input} onChange={(evt)=>store.set({input: evt.target.value})} /><br/>
      <Input medium className="bottom-margin" value={store.state.input} onChange={(evt)=>store.set({input: evt.target.value})} /><br/>
      <Input small className="" disabled value={store.state.input} onChange={(evt)=>store.set({input: evt.target.value})} /><br/>

    </ComponentDoc>
  )))
  .add('with icon', withState({ input: "Hello !" })(({ store }) => (
    <ComponentDoc title="InputIcon" import="import InputIcon from 'components/Inputs/InputIcon.js'"
    properties={[
      ["big", "boolean", "false", "Set button to big size (64px)"],
      ["medium", "boolean", "true", "Set button to medium size (40px)"],
      ["small", "boolean", "false", "Set button to small size (32px)"],
      ["disabled", "boolean", "false", "Disable button"],
    ]}
    infos={"-"}
    >

      <InputIcon icon="search" big className="bottom-margin" value={store.state.input} onChange={(evt)=>store.set({input: evt.target.value})} /><br/>
      <InputIcon icon="search" medium className="bottom-margin" value={store.state.input} onChange={(evt)=>store.set({input: evt.target.value})} /><br/>
      <InputIcon icon="search" small className="" disabled value={store.state.input} onChange={(evt)=>store.set({input: evt.target.value})} /><br/>

    </ComponentDoc>
  )));
