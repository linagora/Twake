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

const stories = storiesOf('Forms|InputsForm', module);
stories.addDecorator(withKnobs);

stories
  .add('big form', () => {
    const total = number("total_state", 4);
    const current = number("current_state", 3);
    return (
    <div className="section">
      <div className="big_form">
        <StepCounter current={current} total={total} />
        <div className="title">
          Create my company {current}/{total}
        </div>
        <div className="subtitle">
          Already working with digital tools? Import or integrate your tools now! <br/>
          No worries, you can do this later!
        </div>

        <div className="body">

          <div className="input_with_label">
            <div className="label">
              What's your company name ?
            </div>
            <Input className="big full_width" value={text("Input value", "")}
            placeholder={text("Input placeholder", "Ex : Google, Aircall, Doctolib")}
            />
          </div>

        </div>

        <div className="footer">

          <button value="Back" inline />

          <button value="Continue" primary />

        </div>

      </div>
    </div>
  )});
