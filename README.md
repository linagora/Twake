# Twake-react v1.0.200

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

# Twake-react v1.0.12

## Changelogs

### Messages
- Fix auto scroll
- Fix bugs

### Drive
- Directory zip download

### Administration
- New backend for entity listing and view

# Twake-core v1.0.1

## Changelogs

### Messages
- Channels groups
- Drag-n-drop anything now
- New notification system more accurate
- New hold on mobile with text selection disabled
- Mute channels

### Workspace management
- Fix group unique name errors


# Twake-core v1.0.0

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
- drag and drop messages to order
- create subjects
- open, close, rename subjects
- see all files
- search messages
- private messages
- jitsi video-conferencing
- edit, delete, pin messages
- emoticons, @username autocomplete
- drag and drop files, from Drive or computer

### Other apps
- Integration of ONLYOFFICE Slides, Spreadsheet, Document
- Integration of Wekan

### Workspace management
- Manage wallpaper, name and logo
- Manage members
- Manage other workspaces from same group
- Create, remove, groups and workspaces

## Installation

## Install twake core
(Recommanded : user linux distribution Debian / Ubuntu)

### Step 1 - MySQL, PHP7.1
- Install mysql and add phpmyadmin if you want (for debugging)
- Create a mysql database and note credentatials
- Install php7.1

### Step 2 - Install php dependancies
- Install php-common
- Install zip
- Install php-zip
- Install php-mbstring
- Install php-zeromq
- In case step 4 do not work because of not installed package, install remaining package and update this README.md file

### Step 3 - Configuration
- Copy /app/config/parameters.yml.dist in /app/config/parameters.yml
- Edit database values needed to connect to your mysql server
- In case step 4 do not work because of sql connexion error, try to toggle between localhost and 127.0.0.1

### Step 4 - Install dependancies
- Run "php composer.phar install"
- If you do not have the file composer.phar you can download it on the Internet

### Step 5 - Update doctrine schemas
- Run "php bin/console doctrine:schema:update --force" or "php bin/console d:s:u --force"

### Step 6 - Initiate website
- Run "php bin/console twake:init -r" to create default admin user and Twake official group

### Run dev server
- To run the dev server : "php bin/console server:run -vvv" or "php bin/console s:r -vvv"
- To run websockets : "php bin/console gos:websockets:server" or "php bin/console g:w:s"
