import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { withState } from '@dump247/storybook-state';
import { specs, describe, it } from 'storybook-addon-specifications'
import {mount} from "enzyme";
import expect from "expect";

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import DatePicker from 'components/Calendar/DatePicker.js';
import DayPicker from 'components/Calendar/DayPicker/DayPicker.js';
import moment from 'moment';

var stories = storiesOf('Components|Date Picker', module);
stories.addDecorator(withKnobs);

stories
  .add('Date Picker (input)', withState({ ts: false })(({ store }) => {
    const story = (<div>
      <ComponentDoc key="1"
      title="Date Picker" import="import DatePicker from 'components/Calendar/DatePicker.js'"
      properties={[
        ["ts", "integer", "null", "Timestamp in seconds (not milliseconds !)"],
        ["onChange", "function", "", "Called when a date is selected"],
        ["big", "boolean", "false", "Set button to medium big (64px)"],
        ["medium", "boolean", "true", "Set button to medium size (40px)"],
        ["small", "boolean", "false", "Set button to small size (32px)"]
      ]}
      infos={"-"}
      >
        <DatePicker ts={store.state.ts || (new Date()).getTime()/1000} onChange={(value)=>store.set({ts: value})} />
      </ComponentDoc>
      <MenusBodyLayer key="2" />
    </div>);

    return story;
  }))
  .add('Day Picker (picker)', withState({ value: moment() })(({ store }) => {
      const story = (<div>
      <ComponentDoc key="1"
      title="Day Picker" import="import DayPicker from 'components/Calendar/DayPicker/DayPicker.js'"
      properties={[
        ["value", "moment", "null", "Moment object representing time"],
        ["onChange", "function(moment)", "", "Called when a date is selected"]
      ]}
      infos={"-"}
      >
        <DayPicker value={store.state.value} onChange={(value)=>store.set({value: value})} />
      </ComponentDoc>
      <MenusBodyLayer key="2" />
    </div>);

    return story;
  }));
