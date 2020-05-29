import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import Workspace from 'components/Leftbar/Workspace/Workspace.js'
import WorkspaceAdd from 'components/Leftbar/Workspace/WorkspaceAdd.js'
import GroupSwitch from 'components/Leftbar/GroupSwitch/GroupSwitch.js'
import PerfectScrollbar from 'react-perfect-scrollbar'


var stories = storiesOf('Left bar|Workspaces', module);
stories.addDecorator(withKnobs);

var workspace = {"id":"481a1a78-4747-11e9-8710-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:23:27.416Z","_deleted":false,"private":false,"logo":"","wallpaper":"","color":"#7E7A6D","group":{"id":"480f11b4-4747-11e9-aa8e-0242ac120005","unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]},"name":"Administratif","total_members":4,"uniqueName":"administratif-85788e87b3","isArchived":false,"isNew":true,"_user_last_access":1552670710,"_user_hasnotifications":false,"front_id":"481a1a78-4747-11e9-8710-0242ac120005","favoris":0,"user_level":{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},"levels":[{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},{"id":"481b01e0-4747-11e9-b11e-0242ac120005","name":"User","admin":false,"default":true,"rights":[]}],"maxWorkspace":9223372036854776000,"currentNbWorkspace":6,"maxUser":9223372036854776000,"maxApps":9223372036854776000,"currentNbUser":12};
var workspace2 = {"id":"481a1a78-4747-11e9-8710-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:23:27.416Z","_deleted":false,"private":false,"logo":"","wallpaper":"","color":"#7E7A6D","group":{"id":"480f11b4-4747-11e9-aa8e-0242ac120005","unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]},"name":"Devs","total_members":4,"uniqueName":"administratif-85788e87b3","isArchived":false,"isNew":true,"_user_last_access":1552670710,"_user_hasnotifications":false,"front_id":"481a1a78-4747-11e9-8710-0242ac120005","favoris":0,"user_level":{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},"levels":[{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},{"id":"481b01e0-4747-11e9-b11e-0242ac120005","name":"User","admin":false,"default":true,"rights":[]}],"maxWorkspace":9223372036854776000,"currentNbWorkspace":6,"maxUser":9223372036854776000,"maxApps":9223372036854776000,"currentNbUser":12};
var workspace3 = {"id":"481a1a78-4747-11e9-8710-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:23:27.416Z","_deleted":false,"private":false,"logo":"https://uinames.com/api/photos/female/11.jpg","wallpaper":"","color":"#7E7A6D","group":{"id":"480f11b4-4747-11e9-aa8e-0242ac120005","unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]},"name":"Devs","total_members":4,"uniqueName":"administratif-85788e87b3","isArchived":false,"isNew":true,"_user_last_access":1552670710,"_user_hasnotifications":false,"front_id":"481a1a78-4747-11e9-8710-0242ac120005","favoris":0,"user_level":{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},"levels":[{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},{"id":"481b01e0-4747-11e9-b11e-0242ac120005","name":"User","admin":false,"default":true,"rights":[]}],"maxWorkspace":9223372036854776000,"currentNbWorkspace":6,"maxUser":9223372036854776000,"maxApps":9223372036854776000,"currentNbUser":12};
var group = {"id":"480f11b4-4747-11e9-aa8e-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:53:35.109Z","_deleted":false,"unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"front_id":"480f11b4-4747-11e9-aa8e-0242ac120005","level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]};
var group2 = {"id":"480f11b4-4747-11e9-aa8e-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:53:35.109Z","_deleted":false,"unique_name":"twake-4","name":"Twake","plan":"standard","logo":"","isBlocked":false,"free_offer_end":null,"front_id":"480f11b4-4747-11e9-aa8e-0242ac120005","level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]};



stories
  .add('a workspace', () => (
    <div style={{background: "#182952", width: 60, paddingTop: 20, paddingBottom: 20}} className="">
      <Workspace workspace={workspace} selected notifications={2} />
      <Workspace workspace={workspace} />
      <Workspace workspace={workspace} notifications={2} />
      <Workspace workspace={workspace3} notifications={2} />
      <Workspace workspace={workspace3} selected notifications={2} />
    </div>
  ));

stories
.add('in workspace bar (no group logo)', () => (
  <div style={{background: "#182952", width: 60, overflow: "hidden", display: "flex",
      flexDirection: "column"}} className="">

      <PerfectScrollbar
        component="div" style={{paddingTop: 20}}>

        <Workspace workspace={workspace} selected notifications={2} />

        <Workspace workspace={workspace2} notifications={2} />

        <WorkspaceAdd />

        <br/><br/><br/><br/>

      </PerfectScrollbar>

      <GroupSwitch group={group2} notifications={2} />

  </div>
));

stories
.add('in workspace bar (group logo)', () => (
<div style={{background: "#182952", width: 60, overflow: "hidden", display: "flex",
    flexDirection: "column"}} className="">

    <PerfectScrollbar
      component="div" style={{paddingTop: 20}}>

      <Workspace workspace={workspace} selected notifications={2} />

      <Workspace workspace={workspace2} notifications={2} />

      <WorkspaceAdd />

      <br/><br/><br/><br/>

    </PerfectScrollbar>

    <GroupSwitch group={group} notifications={2} />

</div>
));
