import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { withState } from '@dump247/storybook-state';
import { specs, describe, it } from 'storybook-addon-specifications'
import {mount} from "enzyme";
import expect from "expect";
import RepetitionSelector from 'components/Calendar/RepetitionSelector/RepetitionSelector.js';
import Select from 'components/Select/Select.js';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';
import MediumPopupComponent from 'components/MediumPopup/MediumPopupComponent.js';
import RepetitionPopup from 'components/Calendar/RepetitionSelector/RepetitionPopup.js'

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

var stories = storiesOf('Components|Repetition Selector', module);
stories.addDecorator(withKnobs);

stories
  .add('Repetition Selector' ,withState({value: "select1"})(({ store }) => {
    const story = (
      <div>
        <RepetitionPopup date="20120201T023000Z" value={"RRule.WEEKLY"}/>
        <RepetitionSelector date = {new Date()} rrule={"DTSTART:20120225T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20130130T230000Z;BYDAY=MO,FR"} value={store.state.value}></RepetitionSelector>
        <MenusBodyLayer key="MenusBodyLayer"/>
        <MediumPopupComponent key="MediumPopupComponent" />

      </div>

    );

    return story;
  }));
