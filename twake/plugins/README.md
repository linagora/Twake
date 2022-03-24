# Twake plugins server

### Run plugin server

1. Update config (TODO)

2. `docker-compose up -d plugins`

### Install new plugin

1. `docker-compose exec plugins yarn install-plugin https://github.com/linagora/Twake-Plugins-Jitsi`

2. `docker-compose restart plugins`
