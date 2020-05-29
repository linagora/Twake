import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import User from 'components/User/User.js'

var stories = storiesOf('Components|Users', module);
stories.addDecorator(withKnobs);

var user1 = {"id":"c87ffd10-59d8-11e9-bf3f-0242ac120005","username":"harry_less","firstname":"Aghiles","lastname":"MANSEUR","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/17c858a20efa179d5b09d591c3c22e84.jpg","connected":false,"language":"en","isNew":false,"isRobot":false,"status_icon":[":pisces:","En train de prendre la première place du top stagiaire "],"front_id":"63cf936c38b9f5f6cb02cac517892512781047d8","timezone_offset":"-120"};
var user2 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/7bbed20e19f7c87ce9bde7a5e4fc78d1.png","connected":false,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user3 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/bfa6f52af4038d53be0ed0a800795438.png","connected":true,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user4 = {"id":"4db463b4-4745-11e9-8c59-0242ac120005","username":"romaricmourgues","firstname":"Romaric","lastname":"Mourgues ","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/2badee1e7c195d95f2c3233ee98d0823.png","connected":true,"language":"fr","isNew":false,"isRobot":false,"status_icon":[":tools:","Improving Twake"],"front_id":"908b6f162e0056fc335df9030ec2b333c0b578df","timezone_offset":"-120", "notifications_preferences":{"devices":0,"dont_disturb_between":21,"dont_disturb_and":5.5,"privacy":0,"dont_use_keywords":1,"keywords":"","disabled_workspaces":[],"workspace":[],"mail_notifications":2,"disable_until": (new Date()).getTime()/1000 + 60000 }};

stories
  .add('Users Heads', () => (
    <ComponentDoc title="Users heads" import="import User from 'components/User/User.js'"
    properties={[
      ["user", "object", "null", "User object from collection"],
      ["big", "boolean", "false", "Set button to big size (40px)"],
      ["medium", "boolean", "true", "Set button to medium size (24px)"],
      ["small", "boolean", "false", "Set button to small size (16px)"],
      ["withStatus", "boolean", "false", "Show status indicator or not"],
      ["withBorder", "boolean", "true", "Has border"],
    ]}
    infos={"-"}
    >
      <User user={user1} small />
      <User user={user1} medium />
      <User user={user1} big />
      <User user={user2} small withStatus />
      <User user={user2} medium withStatus />
      <User user={user2} big withStatus />
      <User user={user3} small withStatus />
      <User user={user3} medium withStatus />
      <User user={user3} big withStatus />
      <User user={user4} small withStatus />
      <User user={user4} medium withStatus />
      <User user={user4} big withStatus />
    </ComponentDoc>
  ));
