# Installation

## Install twake core and twake react in dev mode
(Recommanded : user linux distribution Debian / Ubuntu)

### Step 1 - Docker and docker-compose
Install docker and docker-compose


### Step 3 - Configuration
- `cp /app/config/parameters.yml.dist /app/config/parameters.yml` and edit values
- You can also `cp /Docker/parameters-test.yml /app/config/parameters.yml` for ready to run values
/!\ If you do not use twake onpremise license key to relay mails ans push notifications, you must define a mail server config

### Step 4 - Run
`sudo docker-compose up -d scylladb php websockets elasticsearch_twake nginx`

### Step 4 - Install dependencies
`sudo docker-compose exec php php composer.phar install`
`sudo docker-compose exec php php bin/console twake:init`

### Verify everything works
Go on a browser and type http://localhost:8000

### Start frontend
Go to twake-react/src/client
Edit constants.js to set :
```
window.env = 'local';
[...]
window.API_ROOT_URL = 'http://localhost:8000';
window.WEBSOCKET_URL = 'localhost:8000/ws/';
```
To start front end and easy way in development is to use php -S localhost:8080

### Install connectors