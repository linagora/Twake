import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import Collections from 'services/Collections/Collections.js';

import Button from 'components/Buttons/Button.js';
import Input from 'components/Inputs/Input.js';
import Event from 'components/Calendar/Event/Event.js'

const stories = storiesOf('Event|event', module);
stories.addDecorator(withKnobs);

var event1 = {
    "id":"e43e66a4-726f-11e9-abe1-0242ac130005",
    "front_id":"8881e2ec-402a-a223-3114-7d2b0c91f85f",
    "from":15575041000,
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

    ],
    "notifications":[

    ],
    "tags":[

    ]
 };

 var deplacement = {
     "id":"e43e66a4-726f-11e9-abe1-0242ac130005",
     "front_id":"8881e2ec-402a-a223-3114-7d2b0c91f85f",
     "from":1557504000,
     "to":1557505600,
     "all_day":false,
     "repetition_definition":null,
     "type":"move",
     "title":"deplacement 1",
     "description":"ceci est la description du deplacement",
     "location":"Compus Artem, Nancy",
     "private":null,
     "available":null,
     "owner":"4db463b4-4745-11e9-8c59-0242ac120005",
     "participants":[
        {
          "user_id_or_mail":"c87ffd10-59d8-11e9-bf3f-0242ac120005"
        }
     ],
     "workspaces_calendars":[

     ],
     "notifications":[

     ],
     "tags":[

     ]
  };

  var deadline = {
      "id":"e43e66a4-726f-11e9-abe1-0242ac130005",
      "front_id":"8881e2ec-402a-a223-3114-7d2b0c91f85f",
      "from":1557504000,
      "to":null,
      "all_day":false,
      "repetition_definition":null,
      "type":"deadline",
      "title":"deplacement 1",
      "description":"ceci est la description du deplacement",
      "location":null,
      "private":null,
      "available":null,
      "owner":"4db463b4-4745-11e9-8c59-0242ac120005",
      "participants":[
         {
           "user_id_or_mail":"c87ffd10-59d8-11e9-bf3f-0242ac120005"
         }
      ],
      "workspaces_calendars":[

      ],
      "notifications":[

      ],
      "tags":[

      ]
   };


   var remind = {
       "id":"e43e66a4-726f-11e9-abe1-0242ac130005",
       "front_id":"8881e2ec-402a-a223-3114-7d2b0c91f85f",
       "from":1557504000,
       "to":null,
       "all_day":false,
       "repetition_definition":null,
       "type":"remind",
       "title":"remind",
       "description":"ceci est la description du remind",
       "location":null,
       "private":null,
       "available":null,
       "owner":"4db463b4-4745-11e9-8c59-0242ac120005",
       "participants":[
          {
             "user_id_or_mail":"c87ffd10-59d8-11e9-bf3f-0242ac120005"
          }
       ],
       "workspaces_calendars":[

       ],
       "notifications":[

       ],
       "tags":[

       ]
    };

    var user1 = {
       id: 'c87ffd10-59d8-11e9-bf3f-0242ac120005',
       username: 'harry_less',
       firstname: 'Aghiles',
       lastname: 'MANSEUR',
       thumbnail:
         'https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/17c858a20efa179d5b09d591c3c22e84.jpg',
       connected: false,
       language: 'en',
       isNew: false,
       isRobot: false,
       status_icon: [':pisces:', 'En train de prendre la première place du top stagiaire '],
       front_id: '63cf936c38b9f5f6cb02cac517892512781047d8',
       timezone_offset: '-120',
   };

   var user2 = {
      id: 'c87ffd10-59d8-11e9-bf3f-0242ac120006',
      username: 'harry_less',
      firstname: 'Aghiles',
      lastname: 'MANSEUR',
      thumbnail:
        'https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/17c858a20efa179d5b09d591c3c22e84.jpg',
      connected: false,
      language: 'en',
      isNew: false,
      isRobot: false,
      status_icon: [':pisces:', 'En train de prendre la première place du top stagiaire '],
      front_id: '63cf936c38b9f5f6cb02cac517892512781047d8',
      timezone_offset: '-120',
  };

  Collections.get("users").completeObject(user1);
  Collections.get("users").completeObject(user2);


stories
  /*.add('event', () => {

    Collections.get("users").completeObject(user1);
    Collections.get("users").completeObject(user2);


    return (
       <div>
           <Event event={event1} users = {user1} getColor={()=>"#1abc9c"} className="inEvent" />

           <Event event={deplacement} getColor={()=>"#e67e22"}/>

           <Event event={deadline} getColor={()=>"#8e44ad"} />

           <Event event={remind} getColor={()=>"#c0392b"}/>





       </div>
     )

  });*/

  .add('Event', () => (

    <ComponentDoc title="Event" import="import Event from 'components/Calendar/Event/Event.js'"
    properties={[
      ["users", "object", "null", "liste objects of User type"],
      ["event", "object", "null", ""],
      ["className", "object", "null", "size-15 , size-30 , size-45, size-60"],
    ]}
    infos={"-"}
    >

    <div>

    <h4>Type : event </h4>
    <Event event={event1} users = {user1} getColor={()=>"#1abc9c"} />

    <h4>Type : deplacement</h4>
    <Event event={deplacement} users = {user1} getColor={()=>"#e67e22"}/>

    <h4>Type : deadline</h4>
    <Event event={deadline} users = {user1} getColor={()=>"#ff9f1a"} />

    <h4>Type : remind</h4>
    <Event event={remind} users = {user1} getColor={()=>"#c0392b"}/>

    <h4>User in event</h4>
    <Event event={event1} users = {user1} getColor={()=>"#1abc9c"} inEvent />

    </div>
    </ComponentDoc>
  ));
