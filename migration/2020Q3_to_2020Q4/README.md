# Q3 to Q4 migration script

This script is used to migrate from Q3 to Q4 as we changed our backend database.

To execute this script please start by configuring it, you'll need your encryption key and defaultIv (if you don't know your defaultIv just let it as is it). Then you'll need to configure your database.

Then run 'yarn start' (TODO: replace by a docker execution)

## Migration doc:

### Global view

Node entities:

- channel_activity
- channels
- user_channels
- direct_channels
- channel_members
- channel_members_notification_preferences
- channel_tabs
- user_notification_badges (ignored)
- channel_thread_users (ignored)

PHP entities related:

- channel
- channel_member
- channel_tab

Relation table:

- 'channel' is transfered to 'channels', 'direct_channels', 'channel_activity'
- 'channel_tab' is transfered to 'channel_tabs'
- 'channel_member' is transfered to 'channel_members', 'channel_members_notification_preferences', 'user_channels'

### 'channel' migration

### 'channel_tab' migration

### 'channel_member' migration
