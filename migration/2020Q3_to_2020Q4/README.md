# Q3 to Q4 migration script

This script is used to migrate from Q3 to Q4 as we changed our backend database.

To execute this script please start by configuring it, you'll need your encryption key and defaultIv (if you don't know your defaultIv just let it as is it). Then you'll need to configure your database.

Then run 'yarn start' (TODO: replace by a docker execution)

## Migration doc:

### Global view

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

### 'channel' migration

#### Step 0 Determinage group id if direct channel

If direct channel we need to determinate a company id

//TODO

We call this group id direct_channel_company_id

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
- connectors frozen<set<text>>, (json_decode(PHP:connectors))
- description text, (PHP:description)
- icon text, (PHP:icon)
- is_default boolean, (true)
- name text, (PHP:name)
- owner uuid, (set to empty string "")
- visibility text, direct ? "direct" : (private ? "private" : "public")
- members frozen<set<text>>, direct ? (PHP:identifier).split("+") : []

#### Step 2 If channel is "Direct"

We need to instanciate the "direct_channels" lock.

To Node direct_channels:

- company_id uuid, (direct_channel_company_id)
- users text, ((PHP:identifier).split("+").sort().join(","))
- channel_id uuid, (PHP:id)

### 'channel_tab' migration

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

### 'channel_member' migration

//TODO
