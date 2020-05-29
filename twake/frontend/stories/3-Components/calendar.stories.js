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
import moment from 'moment';

import EventDetails from "scenes/Apps/Calendar/Modals/EventDetails.js";
import EventCreation from "scenes/Apps/Calendar/Modals/EventCreation.js";
import EventModification from "scenes/Apps/Calendar/Modals/EventModification.js";
import DateSelector from "scenes/Apps/Calendar/Modals/Part/DateSelector.js";

const stories = storiesOf('Calendar|Popups', module);
stories.addDecorator(withKnobs);

var calendars = [
  {
    title : "Administratif",
    id : "0001",
    front_id : "0001",
    color : "#27ae60",
    workspace_id: "0001"
  },
  {
    title : "Recrutement",
    id : "0002",
    front_id : "0002",
    color : "#e74c3c",
    workspace_id: "0001"
  }
];

calendars.map(item => {
  Collections.get("calendars").completeObject(item);
});

var event1 = {
  "id":"e43e66a4-726f-11e9-abe1-0242ac130005",
  "front_id":"8881e2ec-402a-a223-3114-7d2b0c91f85f",
  "from":1557504100,
  "to":1557507600,
  "all_day":false,
  "repetition_definition":null,
  "type":"event",
  "title":"Evenement 25",
  "description":"ceci est la description de l'evenement",
  "location":"Compus Artem, Nancy",
  "private":null,
  "available":null,
  "owner":"4db463b4-4745-11e9-8c59-0242ac120005",
  "participants":[
     {
       "user_id_or_mail":"c87ffd10-59d8-11e9-bf3f-0242ac120005",
     },
     {
       "user_id_or_mail":"c87ffd10-59d8-11e9-bf3f-0242ac120006",
     },
     {
       "user_id_or_mail":"kabdi213@gmail.com",
     },
     {
       "user_id_or_mail":"aghiles213@gmail.com",
     },
     {
       "user_id_or_mail":"abdel212@gmail.com",
     }
  ],
  "workspaces_calendars":[
    {}
  ],
  "notifications":[

  ],
  "tags":[

  ]
};
Collections.get("events").completeObject(event1);

stories
  .add('Details', withState({event: event1})(({ store }) => {
    return <div >
      <div className="mediumPopupComponent" style={{overflow: "auto", display: "inline-block", verticalAlign: "top", width: 500, margin: 20, padding: 16, background: "#FFF", borderRadius: 4, boxShadow: "0 0 32px #00000022"}}>
        <EventDetails event={store.state.event} />
      </div>
      <div className="mediumPopupComponent" style={{overflow: "auto", display: "inline-block", verticalAlign: "top", width: 500, margin: 20, padding: 16, background: "#FFF", borderRadius: 4, boxShadow: "0 0 32px #00000022"}}>
        <EventModification event={store.state.event} onChange={(event)=>store.set({event: event})} />
      </div>
      <div className="mediumPopupComponent" style={{overflow: "auto", display: "inline-block", verticalAlign: "top", width: 500, margin: 20, padding: 16, background: "#FFF", borderRadius: 4, boxShadow: "0 0 32px #00000022"}}>
        <EventCreation event={store.state.event} onChange={(event)=>store.set({event: event})} />
      </div>

      <MenusBodyLayer key="MenusBodyLayer"/>
    </div>
  }))
  .add('Date selector', withState({event: event1})(({ store }) => {
    return <div >
      <DateSelector event={store.state.event} onChange={(from, to, all_day, repetition_definition) => {
        store.state.event.from = from;
        store.state.event.to = to;
        store.state.event.all_day = all_day;
        store.state.event.repetition_definition = repetition_definition;
        store.set({event: store.state.event});
      }} />

      F : {moment(store.state.event.from*1000).format("DD/MM/YYYY HH:mm")}<br/>
      T : {moment(store.state.event.to*1000).format("DD/MM/YYYY HH:mm")}<br/>
      A : {store.state.event.all_day?"true":"false"}

      <MenusBodyLayer key="MenusBodyLayer"/>
    </div>
  }));
