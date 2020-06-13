import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';

import ChannelCategory from "components/Leftbar/Channel/ChannelCategory.js"
import Channel from "components/Leftbar/Channel/Channel.js"
import ChannelDroppableZone from "components/Leftbar/Channel/ChannelDroppableZone.js"
import CurrentUser from 'components/Leftbar/CurrentUser/CurrentUser.js'
import Footer from 'components/Leftbar/Footer/Footer.js'

import PerfectScrollbar from 'react-perfect-scrollbar'
import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';

var stories = storiesOf('Left bar|Channels', module);
stories.addDecorator(withKnobs);

stories
  .add('with emoji', () => [
    <Channel text={text("text", "Connecteurs")} emoji={text("icon", ":pizza:")} alinea />,
    <Channel text={"Albatros"} emoji={":dove:"} selected alinea />,
    <Channel text={"A very very very long name"} emoji={":man_student:"} muted alinea />,
    <Channel text={"UX/UI"} emoji={":art:"} imported={"Biz dev"} public alinea private />,
    <Channel text={"Sales"} emoji={":dollar:"} alinea notification={1} />
  ]);

stories
  .add('with app icon', () => [
    <Channel text={"Calendar"} icon={"calendar-alt"} />,
    <Channel text={"Documents"} icon={"folder"} selected />
  ]);

/*
stories
  .add('with app image icon', () => [
    <Channel text={"Joyce"} users={[{}]} />
  ]);
*/

var user1 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/7bbed20e19f7c87ce9bde7a5e4fc78d1.png","connected":false,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user2 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/bfa6f52af4038d53be0ed0a800795438.png","connected":true,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user_connected = {"id":"4db463b4-4745-11e9-8c59-0242ac120005","username":"romaricmourgues","firstname":"Romaric","lastname":"Mourgues ","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/2badee1e7c195d95f2c3233ee98d0823.png","connected":true,"language":"fr","isNew":false,"isRobot":false,"status_icon":[":tools:","Improving Twake"],"front_id":"908b6f162e0056fc335df9030ec2b333c0b578df","timezone_offset":"-120", "notifications_preferences":{"devices":0,"dont_disturb_between":21,"dont_disturb_and":5.5,"privacy":0,"dont_use_keywords":1,"keywords":"","disabled_workspaces":[],"workspace":[],"mail_notifications":2,"disable_until": (new Date()).getTime()/1000 + 60000 }};

stories
  .add('with users', () => [
    <Channel text={"Romain"} users={[user2]} />,
    <Channel text={"Juliette"} users={[user1]} selected />,
    <Channel text={"Juliette"} users={[user1]} />,
    <Channel text={"Juliette, Romain"} users={[user1, user2]} />
  ]);



stories
.add('draggable or not', () => [
<div style={{background: "#F5F5F7", width: 220, paddingTop: 20, height: "85vh", overflow: "hidden", display: "flex",
    flexDirection: "column"}} className="">

  <CurrentUser user={user_connected} onClickUser={()=>action('clicked on user')()} onClickBell={()=>action('clicked on bell')()} style={{marginBottom: 10}} />

  <PerfectScrollbar
    component="div">

    <ChannelCategory text={"CHAÎNES"} />
    <ChannelDroppableZone icon={"favorite"} text={"Star this channel"} />

    <Channel draggable text={"Noon"} emoji={":taco:"} alinea notification={1}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
    <ChannelDroppableZone text={"Add to this group"} />

    <ChannelCategory text={"Draggable"} sub />
    <Channel draggable text={text("text", "Draggable")} emoji={text("icon", ":pizza:")} alinea  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
    <Channel draggable text={"Sales"} emoji={":dollar:"} alinea notification={1}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
    <ChannelDroppableZone text={"Add to this group"} />

    <ChannelCategory text={"Not draggable"} sub />
    <Channel text={"Not draggable"} emoji={":man_technologist:"} alinea public  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
    <ChannelDroppableZone text={"Add in Not draggable"} />

    <ChannelDroppableZone text={"Add to this group"} />

  </PerfectScrollbar>

  <Footer onClickHelp={()=>{}} planName={text("Plan", "free")} />

</div>,
<DraggableBodyLayer key="DraggableBodyLayer" />
]);
