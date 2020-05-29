import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import ComponentDoc from 'components/ComponentsTester/ComponentDoc.js'

import QuickResult from 'components/SearchPopup/Parts/QuickResult.js'

var stories = storiesOf('Components|Quick Search', module);
stories.addDecorator(withKnobs);


var user1 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/7bbed20e19f7c87ce9bde7a5e4fc78d1.png","connected":false,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user2 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/bfa6f52af4038d53be0ed0a800795438.png","connected":true,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};

stories
  .add('Result', () => (
    <ComponentDoc title="QuickResult" import="import QuickResult from 'components/SearchPopup/Parts/QuickResult.js'"
    properties={[
      ["group", "Object", "", "Group of te result"],
      ["workspace", "Object", "", "Workspace of te result"],
      ["text", "string", "", "Name of te result"],
      ["locked", "boolean", "false", "Display corresponding icon"],
      ["public", "boolean", "false", "Display corresponding icon"],
      ["muted", "boolean", "false", "Display corresponding icon"],
      ["selected", "boolean", "false", "Display selected version"],
    ]}
    infos={"-"}
    >
      <QuickResult text={(<span style={{fontWeight:"500"}}>Search <b>« Amaz »</b></span>)} />
      <QuickResult text={(<span style={{fontWeight:"500"}}>Search <b>« Amazon Invoice »</b></span>)} icon="history" />
      <QuickResult text="Customer support" emoji=":pizza:" group={{name: "Twake"}} workspace={{name: "Dev"}} />
      <QuickResult text="Help & Feedback" emoji=":smile:" selected locked public muted  />
      <QuickResult text="Memoire Romaric.pdf" icon="file" />
      <QuickResult text="Some Event" icon="calendar-alt" locked public muted />
      <QuickResult text="Romaric" users={[user1]} />
      <QuickResult text="Romaric, Benoit" users={[user1, user2]} />
    </ComponentDoc>
  ));
