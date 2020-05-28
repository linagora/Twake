# Installation

## Install twake core and twake react in dev mode
(Recommanded : use linux distribution Debian / Ubuntu)

### Step 0 - frontend
`git submodule update --init --recursive;`
OU
```
cd frontend/
git clone git@gitlab.com:Twake/Twake-react.git desktop
```

Puis pour le frontend
```
cd frontend/desktop
git checkout 1.2
yarn install
```


### Step 1 - Docker and docker-compose
Install docker and docker-compose

### Step 2 - Configuration
1. `cp /backend/core/app/Configuration/Parameters.php.dist /backend/core/app/Configuration/Parameters.php`

2. Edit values

/!\ If you do not use twake onpremise license key to relay mails ans push notifications, you must define a mail server config

### Step 4 - Run
`sudo docker-compose up -d`

### Step 4 - Install dependencies
`sudo docker-compose exec php php composer.phar install`
`sudo docker-compose exec php php bin/console twake:init`

### Verify everything works
Go on a browser and type http://localhost:8000

### Start frontend
1. `cd frontend/desktop;`

2. Edit src/app/environment/environment.js
`cp src/app/environment/environment.js.dist  src/app/environment/environment.js `
```
api_root_url: "http://localhost:8000"
websocket_url: "ws://localhost:8000"
```

3. `yarn dev-build`


## Use OpenID

To enable OpenID, in Parameters.php, in auth list add key :
```
"openid" => [
    "use" => true, //Enable OpenID
    "provider_uri" => '', //Provider root or .well-known dir
    "client_id" => '',
    "client_secret" => ''
],
```

To disable classic auth, remove internal key or set enable to false from auth.