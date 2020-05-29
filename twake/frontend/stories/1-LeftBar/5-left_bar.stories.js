import React, { Component } from 'react';
import '../stories.scss'

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';


import "scenes/App/ChannelsBar/ChannelsBar.scss"
import Emojione from 'components/Emojione/Emojione.js';

import ChannelCategory from "components/Leftbar/Channel/ChannelCategory.js"
import Channel from "components/Leftbar/Channel/Channel.js"
import CurrentUser from 'components/Leftbar/CurrentUser/CurrentUser.js'
import Footer from 'components/Leftbar/Footer/Footer.js'

import Workspace from 'components/Leftbar/Workspace/Workspace.js'
import GroupSwitch from 'components/Leftbar/GroupSwitch/GroupSwitch.js'

import PerfectScrollbar from 'react-perfect-scrollbar'
import DraggableBodyLayer from 'components/Draggable/DraggableBodyLayer.js';

var stories = storiesOf('Left bar|Left bar (everything)', module);
stories.addDecorator(withKnobs);

var user1 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/7bbed20e19f7c87ce9bde7a5e4fc78d1.png","connected":false,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user2 = {"id":"f5407788-47d8-11e9-9635-0242ac120005","username":"benoit","firstname":"Benoit","lastname":"Tallandier","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/bfa6f52af4038d53be0ed0a800795438.png","connected":true,"language":"en","isNew":false,"isRobot":false,"status_icon":[":mag:","Cherche le sens de la vie"],"front_id":"a108e9953c89ae8f4b09946a3993efad3b32688c","timezone_offset":"-120"};
var user_connected = {"id":"4db463b4-4745-11e9-8c59-0242ac120005","username":"romaricmourgues","firstname":"Romaric","lastname":"Mourgues ","thumbnail":"https://storage.sbg5.cloud.ovh.net/v1/AUTH_fb6655d359e14e77aa2fa382af8bd6e7/twake_dev_public/public/uploads/prfl/2badee1e7c195d95f2c3233ee98d0823.png","connected":true,"language":"fr","isNew":false,"isRobot":false,"status_icon":[":tools:","Improving Twake"],"front_id":"908b6f162e0056fc335df9030ec2b333c0b578df","timezone_offset":"-120", "notifications_preferences":{"devices":0,"dont_disturb_between":21,"dont_disturb_and":5.5,"privacy":0,"dont_use_keywords":1,"keywords":"","disabled_workspaces":[],"workspace":[],"mail_notifications":2,"disable_until": 0}};

var workspace = {"id":"481a1a78-4747-11e9-8710-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:23:27.416Z","_deleted":false,"private":false,"logo":"","wallpaper":"","color":"#7E7A6D","group":{"id":"480f11b4-4747-11e9-aa8e-0242ac120005","unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]},"name":"Administratif","total_members":4,"uniqueName":"administratif-85788e87b3","isArchived":false,"isNew":true,"_user_last_access":1552670710,"_user_hasnotifications":false,"front_id":"481a1a78-4747-11e9-8710-0242ac120005","favoris":0,"user_level":{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},"levels":[{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},{"id":"481b01e0-4747-11e9-b11e-0242ac120005","name":"User","admin":false,"default":true,"rights":[]}],"maxWorkspace":9223372036854776000,"currentNbWorkspace":6,"maxUser":9223372036854776000,"maxApps":9223372036854776000,"currentNbUser":12};
var workspace2 = {"id":"481a1a78-4747-11e9-8710-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:23:27.416Z","_deleted":false,"private":false,"logo":"","wallpaper":"","color":"#7E7A6D","group":{"id":"480f11b4-4747-11e9-aa8e-0242ac120005","unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]},"name":"Devs","total_members":4,"uniqueName":"administratif-85788e87b3","isArchived":false,"isNew":true,"_user_last_access":1552670710,"_user_hasnotifications":false,"front_id":"481a1a78-4747-11e9-8710-0242ac120005","favoris":0,"user_level":{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},"levels":[{"id":"481adcce-4747-11e9-a21f-0242ac120005","name":"Administrator","admin":true,"default":false,"rights":[]},{"id":"481b01e0-4747-11e9-b11e-0242ac120005","name":"User","admin":false,"default":true,"rights":[]}],"maxWorkspace":9223372036854776000,"currentNbWorkspace":6,"maxUser":9223372036854776000,"maxApps":9223372036854776000,"currentNbUser":12};
var group = {"id":"480f11b4-4747-11e9-aa8e-0242ac120005","_created":true,"_updating":false,"_creating":false,"_persisted":true,"_last_modified":"2019-05-16T14:53:35.109Z","_deleted":false,"unique_name":"twake-4","name":"Twake","plan":"standard","logo":"/upload/grouplogo/2/7d92721973b78539aa02f046b8069c8b.png","isBlocked":false,"free_offer_end":null,"front_id":"480f11b4-4747-11e9-aa8e-0242ac120005","level":["VIEW_USERS","VIEW_WORKSPACES","VIEW_MANAGERS","VIEW_APPS","VIEW_PRICINGS","MANAGE_USERS","MANAGE_WORKSPACES","MANAGE_MANAGERS","MANAGE_PRICINGS","MANAGE_APPS","MANAGE_DATA"]};

stories
  .add('for new user', () => [
    <div style={{display: "flex", height: "85vh"}}>
      <div style={{background: "#F5F5F7", width: 220, paddingTop: 20, maxHeight: "85vh", overflow: "hidden", display: "flex",
          flexDirection: "column"}} className="channels_view">


        <CurrentUser user={user_connected} onClickUser={()=>action('clicked on user')()} onClickBell={()=>action('clicked on bell')()} style={{marginBottom: 10}} />

        <PerfectScrollbar
          component="div">

          <ChannelCategory text={"APPLICATIONS"} style={{marginTop: "14px"}} />
          <Channel text={"Calendar"} icon={"calendar-alt"} onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()} />
          <Channel text={"Documents"} icon={"folder"}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

          <ChannelCategory text={"CHAÎNES"} />
          <Channel draggable text={"Général"} emoji={":man_technologist:"} alinea  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
          <Channel draggable text={"Random"} emoji={":beach_umbrella:"} alinea  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

          <ChannelCategory text={"MESSAGES DIRECTS"} />
          <div className="channel_small_text">
            Aucun message privé, invitez vos collaborateurs ! <Emojione type=":smiley:" />
          </div>

        </PerfectScrollbar>

        <Footer onClickHelp={()=>{}} planName={text("Plan", "free")} />

      </div>
    </div>,
    <DraggableBodyLayer key="DraggableBodyLayer" />
  ]);


  stories
    .add('long date user', () => [
      <div style={{display: "flex", height: "85vh"}}>
        <div style={{background: "#182952", width: 60, overflow: "hidden", display: "flex",
            flexDirection: "column"}} className="">

            <PerfectScrollbar
              component="div" style={{paddingTop: 20}}>

              <Workspace workspace={workspace} selected notifications={2} />

              <Workspace workspace={workspace2} />

            </PerfectScrollbar>

            <GroupSwitch group={group} notifications={2} />

        </div>
        <div style={{background: "#F5F5F7", width: 220, paddingTop: 20, maxHeight: "85vh", overflow: "hidden", display: "flex",
            flexDirection: "column"}} className="">


          <CurrentUser user={user_connected} onClickUser={()=>action('clicked on user')()} onClickBell={()=>action('clicked on bell')()} style={{marginBottom: 10}} />

          <PerfectScrollbar
            component="div">

            <ChannelCategory text={"APPLICATIONS"} style={{marginTop: "14px"}} />
            <Channel text={"Calendar"} icon={"calendar-alt"} onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()} />
            <Channel text={"Documents"} icon={"folder"}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

            <ChannelCategory text={"CHAÎNES"} />
            <Channel draggable text={"Général"} emoji={":man_technologist:"} alinea public  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

            <ChannelCategory text={"Développement"} sub />
            <Channel draggable text={text("text", "Connecteurs")} emoji={text("icon", ":pizza:")} alinea  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
            <Channel draggable text={"Albatros"} emoji={":dove:"} selected alinea  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
            <Channel draggable text={"A very very very long name"} emoji={":man_student:"} muted alinea  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
            <Channel draggable text={"UX/UI"} emoji={":art:"} imported={"Biz dev"} alinea private  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
            <Channel draggable text={"Sales"} emoji={":dollar:"} alinea notifications={1}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

            <ChannelCategory text={"MESSAGES DIRECTS"} />
            <Channel text={"Romain"} users={[user2]} call />
            <Channel text={"Juliette"} users={[user1]} />
            <Channel text={"Juliette, Romain"} users={[user1, user2]} />
            <Channel text={"George"} users={[user1]} />

          </PerfectScrollbar>

          <Footer onClickHelp={()=>{}} planName={text("Plan", "Standard")} />

        </div>
      </div>,
      <DraggableBodyLayer key="DraggableBodyLayer" />
    ]);

stories
  .add('loading app (A)', () => [
    <div style={{display: "flex", height: "85vh"}} className="loading_render">
      <div style={{background: "#F5F5F7", width: 220, paddingTop: 20, maxHeight: "85vh", overflow: "hidden", display: "flex",
          flexDirection: "column"}} className="">


        <CurrentUser user={user_connected} onClickUser={()=>action('clicked on user')()} onClickBell={()=>action('clicked on bell')()} style={{marginBottom: 10}} />

        <PerfectScrollbar
          component="div">

          <ChannelCategory text={"APPLICATIONS"} style={{marginTop: "14px"}} />
          <Channel text={"Calendar"} icon={"calendar-alt"} onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()} />
          <Channel text={"Documents"} icon={"folder"}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

          <ChannelCategory text={"CHAÎNES"} />
          <Channel draggable text={"Général"} emoji={":man_technologist:"} alinea public  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
          <Channel draggable text={"UX/UI"} emoji={":art:"} imported={"Biz dev"} alinea private  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
          <Channel draggable text={"Sales"} emoji={":dollar:"} alinea notifications={1}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

          <ChannelCategory text={"MESSAGES DIRECTS"} />
          <Channel text={"Romain"} users={[user2]} call />
          <Channel text={"Juliette"} users={[user1]} />

        </PerfectScrollbar>

        <Footer onClickHelp={()=>{}} planName={text("Plan", "Standard")} />

      </div>
    </div>,
    <DraggableBodyLayer key="DraggableBodyLayer" />
  ]);

stories
  .add('loading app (B)', () => [
    <div style={{display: "flex", height: "85vh"}} className="loading_render">
      <div style={{background: "#182952", width: 60, overflow: "hidden", display: "flex",
          flexDirection: "column"}} className="">

          <PerfectScrollbar
            component="div" style={{paddingTop: 20}}>

            <Workspace workspace={workspace} selected notifications={2} />

            <Workspace workspace={workspace2} />

          </PerfectScrollbar>

          <GroupSwitch group={group} notifications={2} />

      </div>
      <div style={{background: "#F5F5F7", width: 220, paddingTop: 20, maxHeight: "85vh", overflow: "hidden", display: "flex",
          flexDirection: "column"}} className="">


        <CurrentUser user={user_connected} onClickUser={()=>action('clicked on user')()} onClickBell={()=>action('clicked on bell')()} style={{marginBottom: 10}} />

        <PerfectScrollbar
          component="div">

          <ChannelCategory text={"APPLICATIONS"} style={{marginTop: "14px"}} />
          <Channel text={"Calendar"} icon={"calendar-alt"} onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()} />
          <Channel text={"Documents"} icon={"folder"}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

          <ChannelCategory text={"CHAÎNES"} />
          <Channel draggable text={"Général"} emoji={":man_technologist:"} alinea public  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
          <Channel draggable text={"UX/UI"} emoji={":art:"} imported={"Biz dev"} alinea private  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />
          <Channel draggable text={"Sales"} emoji={":dollar:"} alinea notifications={1}  onClickMore={()=>action('clicked on more')()} onClick={()=>action('clicked on channel')()}  />

          <ChannelCategory text={"MESSAGES DIRECTS"} />
          <Channel text={"Romain"} users={[user2]} call />
          <Channel text={"Juliette"} users={[user1]} />

        </PerfectScrollbar>

        <Footer planName={text("Plan", "Standard")} />

      </div>
    </div>,
    <DraggableBodyLayer key="DraggableBodyLayer" />
  ]);
