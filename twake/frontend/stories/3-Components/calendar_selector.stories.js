import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { withState } from '@dump247/storybook-state';
import MenusBodyLayer from 'components/Menus/MenusBodyLayer.js';

import Collections from 'services/Collections/Collections.js';
import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'
import Input from 'components/Inputs/Input.js';
import CalendarSelector from 'components/Calendar/CalendarSelector/CalendarSelector.js'



const stories = storiesOf('Calendar|CalendarSelector', module);
stories.addDecorator(withKnobs);
//
var calendars = [
    {
      title : "calendar 1",
      id : "0001",
      front_id : "calendar 1",
      color : "#27ae60"
    },
    {
      title : "calendar 2",
      id : "0002",
      front_id : "calendar 2",
      color : "#e74c3c"
    }
  ];

  calendars.map(item => {
    Collections.get("calendars").completeObject(item);
  });

stories

  .add('EventSelector', withState({calendars: []})(({ store }) => {
    return(
    <ComponentDoc title="CalendarSelector" import="import CalendarSelector from 'components/Calendar/CalendarSelector/CalendarSelector.js'"
    properties={[
      ["value", "object", "null", "List of calendar ids"],
      ["onChange", "method", "null", "Callback with calendar ids as first parameter"],
      ["calendarList", "object", "[]", "List of all available calendars"],
      ["readonly", "boolean", "false", ""],
    ]}
    infos={"-"}
    >

      <CalendarSelector value={store.state.calendars} onChange={(cal_ids)=>{store.set({calendars: cal_ids})}} calendarList={calendars}/>
      <br/>
      <CalendarSelector value={store.state.calendars} readonly onChange={(cal_ids)=>{store.set({calendars: cal_ids})}}/>

      <MenusBodyLayer key="MenusBodyLayer"/>

    </ComponentDoc>
  )}));
