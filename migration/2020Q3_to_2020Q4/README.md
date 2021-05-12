# Q3 to Q4 migration script

This script is used to migrate from Q3 to Q4 as we changed our backend database.

To execute this script please start by configuring it, you'll need your encryption key and defaultIv (if you don't know your defaultIv just let it as is it). Then you'll need to configure your database.

Then run 'docker build . -t migration; docker run --env NODE_ENV=production migration'

## How to migrate from 2020.Q3 (or earlier) to 2020.Q4 ?

### Step 1 - Do a backup of your data !!!

You need to backup all your files from Twake Drive and your scylladb data before to proceed!

This script will write into your database so beware!

### Step 2 - Update docker-compose and get last changes

Go to twake/

- Replace docker-compose.yml with new one from Q4 (note the new _node_ service!)

- Pull docker images from the _latest_ tag

### Step 3 - Update configuration

Go to twake/

#### Create new node configuration

In configuration/backend-node/production.json

```
{
  "phpnode": {
    "secret": "api_supersecret (set the same in php later)"
  },
  "websocket": {
    "path": "/socket/",
    "adapters": {
      "types": []
    },
    "auth": {
      "jwt": {
        "secret": "supersecret (use the same as in php)"
      }
    }
  },
  "auth": {
    "jwt": {
      "secret": "supersecret (use the same as in php)"
    }
  },
  "database": {
    "secret": "GET YOUR SECRET FROM PHP Parameters.php: db.secret",
    "type": "cassandra",
    "cassandra": {
      "contactPoints": ["scylladb:9042"],
      "localDataCenter": "datacenter1",
      "keyspace": "twake",
      "wait": false,
      "retries": 10,
      "delay": 200
    }
  },
  "pubsub": {
    "urls": ["amqp://admin:admin@rabbitmq:5672"]
  }
}
```

#### Add new configuration for node backend and JWT

Add this in root configuration of Parameters.php

```
"jwt" => [
    "secret" => "supersecret",
    "expiration" => 60*60, //1 hour
    "refresh_expiration" => 60*60*24*31 //1 month
],
"node" => [
    "api" => "http://node:3000/private/",
    "secret" => "api_supersecret"
],
```

#### Storage update

Now we provide a multi-buckets feature that allows our users to defined multiple buckets and loadbalance files between them. A bucket can also be defined as readonly if it is no longer needed.

```
"storage" => [
    "drive_previews_tmp_folder" => "/tmp/",
    "drive_tmp_folder" => "/tmp/",
    "drive_salt" => "SecretPassword",
    "S3" => [
        "use" => false
        ...
    ],
    "openstack" => [
        "use" => true
        ...
    ],
    "local" => [
        "use" => false
        ...
    ]
```

becomes

```
"storage" => [
    "drive_previews_tmp_folder" => "/tmp/",
    "drive_tmp_folder" => "/tmp/",
    "drive_salt" => "SecretPassword",
    "providers" => [
        [
        "label" => "someawss3",
        "type" => "S3",
        "use" => false
        ...
        ],
        [
        "label" => "someopenstack",
        "type" => "openstack",
        "use" => true,
        ...
        ],
        [
        "label" => "somelocal",
        "type" => "local",
        "use" => false
        ...
        ]
    ]
```

### Step 2 - Migrate database to new format

Go to migration/2020Q3_to_2020Q4/

```
cp config/default.json config/production.json
#Edit production.json if needed to connect to scylladb database
docker build . -t migration; docker run --env NODE_ENV=production migration
```

### Step 3 - Test

Go back to twake/

Run twake with `docker-compose up -d`

You should see your previous channels and the new features.

## Database migration developer details:

### 1 - Global view

Node entities:

- channels
- user_channels
- direct_channels
- channel_members
- channel_members_notification_preferences
- channel_tabs
- channel_activity (ignored)
- user_notification_badges (ignored)
- channel_thread_users (ignored)

PHP entities related:

- channel
- channel_member
- channel_tab

Relation table:

- 'channel' is transfered to 'channels', 'direct_channels'
- 'channel_tab' is transfered to 'channel_tabs'
- 'channel_member' is transfered to 'channel_members', 'channel_members_notification_preferences', 'user_channels'

### 2 - 'channel' migration

#### Step 0 Determinage group id if direct channel

If direct channel we need to determinate a company id
We call this company id direct_channel_company_id

- Get users in this direct discussion,
- Get list of companies of each users,
- See what companies matches all users in direct channel
- (1) If there is exactly one such company: use it as direct_channel_company_id
- (>1) If there is more than one such company: use the company with the bigest number of members
- (0) If there is zero such companies: delete this channel and note its id in order to fix this manualy after the script runs

#### Step 1 Migrate workspaces channels

During channel migration we need to generate two more entities from the first one.

From PHP channel:

- direct tinyint,
- original_workspace_id text,
- id timeuuid,
- app_bot_identifier text,
- app_group_id text,
- app_id text,
- application tinyint,
- auto_mute tinyint,
- channel_group_name text,
- connectors text,
- description text,
- es_indexed tinyint,
- ext_members text,
- external_access_token text,
- front_id text,
- icon text,
- identifier text,
- last_activity timestamp,
- members text,
- members_count int,
- messages_count int,
- messages_increment int,
- name text,
- original_group_id timeuuid,
- private tinyint,
- tabs text,

To Node channels:

- company_id uuid, (PHP:original_group_id)
- workspace_id text, direct ? "direct" : (PHP:original_workspace_id)
- id uuid, (PHP:id)
- archived boolean, (false)
- channel_group text, direct ? direct_channel_company_id : (PHP:channel_group_name)
- connectors json, (json_decode(PHP:connectors))
- description text, (PHP:description)
- icon text, (PHP:icon)
- is_default boolean, (true)
- name text, (PHP:name)
- owner uuid, (set to empty string "")
- visibility text, direct ? "direct" : (private ? "private" : "public")
- members json, direct ? (PHP:identifier).split("+") : []

#### Step 2 If channel is "Direct"

We need to instanciate the "direct_channels" lock.

To Node direct_channels:

- company_id uuid, (direct_channel_company_id)
- users text, ((PHP:identifier).split("+").sort().join(","))
- channel_id uuid, (PHP:id)

### 3 - 'channel_tab' migration

As we need company_id and workspace_id, best is to run this when we get the channel itself.

From PHP channel_tab:

- channel_id timeuuid,
- app_id timeuuid,
- id timeuuid,
- configuration text,
- front_id text,
- name text,

To Node channel_tabs:

- company_id text, (Got from channel entity)
- workspace_id text, (Got from channel entity)
- channel_id text, (PHP:channel_id)
- id text, (PHP:id)
- application_id text, (PHP:app_id)
- col_order text, (set to empty string "")
- configuration text, (PHP:configuration)
- name text, (PHP:name)
- owner text, (set to empty string "")

### 4 - 'channel_member' migration

We said before that 'channel_member' is transfered to 'channel_members', 'user_channels' and 'channel_members_notification_preferences'

The two first recipients are just two indexation side to access all channels of a member or all members of a channel.

The last one contains notification preferences for this channel for this user.

From PHP channel_member:

- direct tinyint,
- user_id text,
- channel_id timeuuid,
- id timeuuid,
- externe tinyint,
- last_access timestamp,
- last_activity timestamp,
- last_activity_least_updated timestamp,
- last_messages_increment int,
- last_quoted_message_id text,
- muted tinyint,

To Node channel_members:

- company_id uuid, (Channel company_id)
- workspace_id text, (Channel workspace_id)
- channel_id uuid, (Channel id)
- user_id uuid, (User id)
- type text, (set to 'member')

To Node user_channels:

- company_id uuid, (Channel company_id)
- workspace_id text, (Channel workspace_id)
- user_id uuid, (User id)
- channel_id uuid, (Channel id)
- expiration bigint, (set to 0)
- favorite boolean, (set to false)
- last_access bigint, (set to 0)
- last_increment bigint, (set to 0)
- notification_level text, (Follow this table: muted=0 => 'all' ; muted=1 => 'mentions' ; muted=2 => 'me' ; muted=3 => 'none')
- type text, (set to 'member')

To Node channel_members_notification_preferences:

- company_id uuid, (Channel company_id)
- channel_id uuid, (Channel id)
- user_id uuid, (User id)
- last_read bigint, (set to 0)
- preferences text, (Follow this table: muted=0 => 'all' ; muted=1 => 'mentions' ; muted=2 => 'me' ; muted=3 => 'none')
