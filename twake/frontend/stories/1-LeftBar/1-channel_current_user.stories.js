import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import CurrentUser from 'components/Leftbar/CurrentUser/CurrentUser.js'

var stories = storiesOf('Left bar|Current user', module);
stories.addDecorator(withKnobs);

var user1 = {"id":"4db463b4-4745-11e9-8c59-0242ac120005","username":"romaricmourgues","firstname":"Romaric","lastname":"Mourgues ","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/2badee1e7c195d95f2c3233ee98d0823.png","connected":true,"language":"fr","isNew":false,"isRobot":false,"status_icon":[":tools:","Improving Twake"],"front_id":"908b6f162e0056fc335df9030ec2b333c0b578df","timezone_offset":"-120", "notifications_preferences":{"devices":0,"dont_disturb_between":21,"dont_disturb_and":5.5,"privacy":0,"dont_use_keywords":1,"keywords":"","disabled_workspaces":[],"workspace":[],"mail_notifications":2,"disable_until": (new Date()).getTime()/1000 + 60000 }};
var user2 = {"id":"4db463b4-4745-11e9-8c59-0242ac120005","username":"romaricmourgues","firstname":"Romaric","lastname":"Mourgues ","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/2badee1e7c195d95f2c3233ee98d0823.png","connected":true,"language":"fr","isNew":false,"isRobot":false,"status_icon":[":tools:","Improving Twake"],"front_id":"908b6f162e0056fc335df9030ec2b333c0b578df","timezone_offset":"-120", "notifications_preferences":{"devices":0,"dont_disturb_between":21,"dont_disturb_and":5.5,"privacy":0,"dont_use_keywords":1,"keywords":"","disabled_workspaces":[],"workspace":[],"mail_notifications":2,"disable_until": 0 }};

stories
  .add('all', () => [
    <div style={{background: "#F5F5F7", width: 220, paddingTop: 20, paddingBottom: 20, marginBottom: 20, maxHeight: "85vh", overflow: "hidden", display: "flex",
        flexDirection: "column"}} className="">
      <CurrentUser user={user1} />
    </div>,
    <div style={{background: "#F5F5F7", width: 220, paddingTop: 20, paddingBottom: 20, maxHeight: "85vh", overflow: "hidden", display: "flex",
        flexDirection: "column"}} className="">
      <CurrentUser user={user2} />
    </div>
  ]);
