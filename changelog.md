# Twake 2022.Q4.1120

- Message delivery status 🟢
- New quote-reply feature ⤴️
- Notification when someone react to your message 👍
- New file preview and medias gallery with navigation, caption, and message context 🕶
- New badge notification system (mention, unread, etc)
- Digest notifications by email ✉️
- Ability to customize notification sound
- Improved user live status indicator
- See when user was last active on Twake ⏰
- Big simplification of backend 👩‍💻

# Twake 2022.Q3.1065

- File and medias channel gallery view 🎞
- New channel members invitation and management modal ⚙️
- Fixed connection status of users 🟢
- New messages search feature on mobile 🔎
- Fixed bugs and translation #2425 #2424 #2420 #2442 #2436 #2435

# Twake 2022.Q3.1050

- Open desktop app if present in the system
- Preview public channels before to join them
- Updated [Search anything on Twake](https://github.com/linagora/Twake/issues/1710)
- Started using Tailwindcss for future new design
- Started using Storybooks

# Twake 2022.Q2.975

### Backend

- [Implemented the list of uploaded in our backend](https://github.com/linagora/Twake/issues/2127)
- [Jump to a message](https://github.com/linagora/Twake/issues/1926)
- [Search for messages](https://github.com/linagora/Twake/issues/1710)
- Generate links previews
- Multiple bug fixes

### Bug fixed

- [Fixed thumbnail rotatation when uploaded from mobile](https://github.com/linagora/Twake/issues/2111)
- [Scrolling message feed isn't smooth](https://github.com/linagora/Twake/issues/2039)
- [Position of Close (x) buttons are not consistent](https://github.com/linagora/Twake/issues/2031)
- [Mention user by any namu or identifier](https://github.com/linagora/Twake/issues/2042)
- [Update workspace name reset the logo](https://github.com/linagora/Twake/issues/1950)
- [Empty channel isn't working](https://github.com/linagora/Twake/issues/2146)
- [On Twake desktop I have notifications only inside Twake window and when it's collapsed I don't see them](https://github.com/linagora/Twake/issues/2043)
- [Windows notification has no redirection](https://github.com/linagora/Twake/issues/125)
- [Clicking on push notification does not open the right message](https://github.com/linagora/Twake/issues/396)

# Twake 2022.Q2.930

### Backend

- Refactoring of how we get services in our backend

### Bug fixed

- https://github.com/linagora/Twake/pull/2092

# Twake 2022.Q2.910

### Messages

- Copy paste images to message editor fixed
- Large files preview is now available
- Mentions are back in messages
- Giphy, n8n and Jitsi are back

### General

- New workspaces parameters page view
- Ability to create and manage plugins from Twake

### Backend

- New backend routes to get files and pinned messages of a channel
- New search messages routes

### Bug fixed

- Fixed thumbnail generation
- https://github.com/linagora/Twake/issues/2083
- https://github.com/linagora/Twake/issues/2091
- https://github.com/linagora/Twake/issues/2095
- https://github.com/linagora/Twake/issues/2037
- https://github.com/linagora/Twake/issues/2036
- https://github.com/linagora/Twake/issues/1918
- https://github.com/linagora/Twake/issues/2102

# Twake 2022.Q1.890

### Messages

- Shows that the last message was deleted on mobile channel list view
- Now we can cancel failed file uploads
- Add spell check to message editor

### General

- Save the user last visited companies to open them again after logout
- Fixed magic links
- Show a popup to decide to continue on web or open the mobile app
- Notice users that the company reached the maximum number of users
- Fixed some issues with workspace invitation
- Minor bugs fixed

# Twake 2022.Q1.874

### Messages

- Faster loading of message feed
- Fix message input issues

### General

- Reduce magic links invite urls
- Fix guest popup not visible on paid plans
- Fix company owners and admins not able to manage workspaces
- Fix channels members counters
- Migrate channels to recoil state management for more stable channels (favorite, rename, create, join etc)

# Twake 2021.Q4.860

### Messages

- Improved message top right menu
- Fixed message sending / edition / reaction / pinned etc, now instant ⚡️
- User availability indicator 🟢
- User is writing indicator

### Workspace parameters

- Improved integrations management page 🧹
- Improved workspace users management page 🧹
- Improved workspace preferences management page 🧹

### General

- A lot of bug fixed, more to come on the 22 of January 🐞
- Improved Twake loading time (still in progress) ⏰
- New state management ( recoiljs.org ) on everything except channels and channels members
- Everything except Drive Tasks and Calendar was migrated to node backend 🧹
- Twake is now working with a simplified docker-compose with only node + mongodb. Note that this works only with messages (no Drive, Calendar or Tasks yet) 🚀

# Twake 2021.Q3.640

### Messages

- New message WYSIWYG editor 🎨
- Added limit to message size and to number of attached files
- Deleted messages are now showed as "Deleted" but don't disappear
- Limit number of users in the same direct channel
- You can now set multiple reactions to a single message 🌟👍🔥

### General

- Twake is now on [Weblate](https://hosted.weblate.org/projects/twake/) 🌎
- Multiple bugs fixes

# Twake 2021.Q2.550

### Messages

- Fix missing notification when a first direct channel message is sent
- Now using the new nodejs backend (need to run `sudo docker-compose run node node bin/twake-cli migration message` after update). PHP endpoints (`/ajax/discussion/...`) are still working but are depreciated.

### General

- Update oidc login workflow for Console connectivity

### Technical changes

- Migrated users, companies, workspaces endpoints to nodejs (frontend not yet using theses endpoints)
- Migrated file service to nodejs (frontend not yet using theses endpoints)
- Migrated messages service to nodejs (frontend not yet using theses endpoints)
- Created Search, Storage and PushNotification internal services

# Twake 2021.Q2.505

### Messages

- Performance improvement and bug fixing
- Ability to invite external users as guest directly in channel

# Twake 2021.Q2.481

### Messages

- Fix a bug making too many desktop notifications at the same time.
- Fix a bug when sending a message using the send button, message now disapear as expected.
- Fix the "hidden notification" button that can be stuck on top or bottom of the channel list.

### Console

- Now if you change your language on Console it will affect Twake accordingly.
- Better onboarding of new users: automatic channel selection, add collaborators button, invite collaborators from Twake using console management app and more.
- Polishing console migration script, previous Twake users will soon uses the Console.

# Twake 2021.Q1.434

### Messages

- Default channels now available 🌟 You can set a channel as default, new users invited in workspace will be automatically added to this channel.

### General

- Console onboarding update (soon open source!)
- Multiple bug fixes

# Twake 2021.Q1.401

### General

- First elements of Twake new design, welcome to blue #3840f7
- Cmd+K / Ctrl+K now working on all channels types (direct and workspace channels)
- Multiple bug fixes

# Twake 2021.Q1.385

### General

- Twake is on OVH! OVH is a french infrastructure provider, it is a big step for us. Good bye Amazon 👋
- Started migration to NodeJS from PHP (30%) for faster and lighter server, compatibility with MongoDB and more!
- Move to socket.io from socketcluster for more robust websockets.
- We are now compatible with the Twake Console. Twake account and group management will be soon fully replaced by the Console.
- Big performances upgrades, we fixed a lot of memory leaks in the last weeks.

### Channels

- Ability to join and leave channels.
- Channel activity messages.
- Access and rights for channel creation updated (now everyone can create channels).
- Favorite direct channels, now you can put your direct channels in favorites too.
- Channel groups are back! Yes, you can again create groups of channels to organize your workspace.
- Channel members list: see who is in a channel and manage members

### Notifications

- Now you only receive badge notification for threads you follow and when you are mentionned.
- Other messages in channel will update the channel text to bold.

### Drive

- Ability to preview coding files and markdown files

# Twake 2020.Q4.137

### General

- Twake is on OVH! OVH is a french infrastructure provider, it is a big step for us. Good bye Amazon 👋
- Started migration to NodeJS from PHP (30%) for faster and lighter server, compatibility with MongoDB and more!
- Move to socket.io from socketcluster for more robust websockets.
- We are now compatible with the Twake Console. Twake account and group management will be soon fully replaced by the Console.
- Big performances upgrades, we fixed a lot of memory leaks in the last weeks.

### Channels

- Ability to join and leave channels.
- Channel activity messages.
- Access and rights for channel creation updated (now everyone can create channels).
- Favorite direct channels, now you can put your direct channels in favorites too.
- Channel groups are back! Yes, you can again create groups of channels to organize your workspace.
- Channel members list: see who is in a channel and manage members

### Notifications

- Now you only receive badge notification for threads you follow and when you are mentionned.
- Other messages in channel will update the channel text to bold.

### Drive

- Ability to preview coding files and markdown files

# Twake 2020.Q3.107

## Changelogs

### General

- New apple emoji set
- Fix unwanted deconnections and missing notifications
- Fix autocompletion glitches

### Messages

- New message feed design
- Improve performance in messages list and when getting previous messages
- Ability to prepare files before sending them with a message
- Ability to add files in a thread
- Allow ctrl-v documents in messages
- Ability to get a link to a specific thread
- Change formatting rules to be markdown compatible

# Twake 2020.Q3.70

## Changelogs

### General

- Workspace members search and list improvement

### Messages

- New notifications parameters per channels (@mention, @all or nothing)
- Channel description header

# Twake v1.2.2

## Changelogs

### General

- Added Russian translations
- Improve missing translations
- Improve design with smaller components
- Simplier installation procedure
- OIDC auth mode for On-Premise installations
- Brand global style and logos customization
- New emoji style on Apple devices

### Messages

- Side view for threads
- Shortcuts for last message edition
- Show only relevant private channels

### Connectors

- Built-in connectors, no second server required
- LinShare document selection connector for messages
- Jitsi select meeting name

# Twake v1.2.1

## Changelogs

### General

- Full new design
- External users
- Task advanced search
- Event advanced search
- Files advanced search
- Message advanced search
- Export your company
- Quick search and chanel change
- Tabs system

### Tasks

- Improved Tasks

### Dive

- Upload for files over 100mo
- Link-files
- Files as tab
- Public directory/file link
- Files versioning

### Calendar

- Improved calendar

### Mobile

- Drive on native mobile app
- Tabs on mobile
- Tasks on mobile (v1)
- Messages on native mobile app

### Connectors

- New public API and connectors manager
- Google Drive Sync
- Zapier integration enabled
- Gitlab (notifications in messages)
- Github (notifications in messages)
- Webhooks
- Reminder (reminder bot)
- Simple Poll (for messages)
- Giphy
- RSS (notifications for messages)
- Jitsi (video conferencing)
- ONLYOFFICE (integrated with drive)

## Changelogs

### General

- Ability to link objects of type event, task, call or file
- Apps open faster
- Ability to app any link by choosing an application manual mode
- New message modal for private messages
- Objects fields synchronisation

### On-premise

- Obfuscator code
- Integrate Onlyoffice in Twake core code

# Twake v1.1.110

## Changelogs

### General

- Ability to link objects of type event, task, call or file
- Apps open faster
- Ability to app any link by choosing an application manual mode
- New message modal for private messages
- Objects fields synchronisation

### On-premise

- Obfuscator code
- Integrate Onlyoffice in Twake core code

# Twake v1.1.100

## Changelogs

### Messages

- Highlight new messages

### Tasks

- Add Tasks app to manage tasks and projects

### Calendar

- Ability to auto import ics each 15 minutes
- Team members calendars

### General

- Team activity

# Twake v1.1.001

## Changelogs

### Calendar

- Add export link

### Drive

- Add files versions

### General

- Change private workspace conception
- Add navigation buttons for external apps

# Twake v1.1

## Changelogs

### Messages

- New app with better performances
- Remove temporarly subjects
- New respond button

### Apps

- Ability to integrate external apps

### Calendar

- Ability to import and export ics
- Ability to subscribe to calendar
- Mini google map for event location

### Drive

- Ability to subscribe to directory
- Async preview generation

### General

- Remove bootstrap and use ant.design
- New workspace start page
- New left bar with last messages and last notification
- New icons
- New subscribe popups
- Ability to hide workspaces, make workspaces favorite
- Ability to search in all workspaces
- Show who is with you on the same page
- New responsive UI for all apps
- New activity center for all apps

# Twake-react v1.0.310

## Changelogs

### Messages

- Fix remove and add streams
- Fix update stream badge

### Apps

- Calendar backend

### General

- Managers system
- Group workspace unique name and identifier

# Twake v1.0.300

## Changelogs

### Messages

- Repear notification system
- New push notification separated server
- Fix error creating subjects

### Apps

- Messages modules apps
- Marketplace of apps
- Group apps management
- Add Giphy app

### General

- Right and levels system and management

# Twake v1.0.200

## Changelogs

### Messages

- Highlight new messages
- Add badge icon for subject tab
- Fix autocomplete click, fix message link parsing

### Apps

- Better images preview on mobile
- PDF viewer for all devices

### General

- Ability to enable disable app in workspace
- New app system implemented in backend (messages modules, capables apps, defaults apps...)
- Modify UX for groups and workspaces
- Better presentation for disconnected state
- Reduce animations

# Twake v1.0.12

## Changelogs

### Messages

- Fix auto scroll
- Fix bugs

### Drive

- Directory zip download

### Administration

- New backend for entity listing and view

# Twake v1.0.1

## Changelogs

### Messages

- Channels groups
- Drag-n-drop anything now
- New notification system more accurate
- New hold on mobile with text selection disabled
- Mute channels

### Workspace management

- Fix group unique name errors

# Twake v1.0.0

## Features

### General

- Account setup
- Multiple emails
- Notification parameters
- Private workspace
- Contacts management
- Subscribe / Login
- Password recovery
- Translated to French and English

### Drive

- Drag and drop multiple files to upload
- Drag and drop to move files in Drive
- Click to see preview and details
- Details include : description, name, labels
- Search file, get files by date, manage trash
- Download, open, duplicate, move in trash
- List or block views

### Messages

- Create, modify and remove channels
- Private and public channels
- drag and dr

### Other apps

- Integration of ONLYOFFICE Slides, Spreadsheet, Document
- Integration of Wekan

### Workspace management

- Manage wallpaper, name and logo
- Manage members
- Manage other workspaces from same group
- Create, remove, groups and workspaces
