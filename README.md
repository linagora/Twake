# Installation

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

# Development

### TODO
