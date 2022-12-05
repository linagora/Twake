![](https://twake.app/medias/Twake-long.png)

# Twake - The Open Digital Workplace

![update-saas-backend](https://github.com/TwakeApp/Twake/workflows/update-saas-backend/badge.svg?branch=main&style=flat)
![update-saas-frontend](https://github.com/TwakeApp/Twake/workflows/update-saas-frontend/badge.svg?branch=main&style=flat)
![backend-build](https://github.com/TwakeApp/Twake/workflows/backend-build/badge.svg?branch=main&style=flat)
[![docker-build](https://github.com/Twake/Twake/actions/workflows/docker.yml/badge.svg)](https://github.com/Twake/Twake/actions/workflows/docker.yml)

![Docker](https://img.shields.io/docker/pulls/twaketech/twake-node?style=flat)
[![Docs](https://img.shields.io/badge/docs-up--to--date-blueviolet?style=flat)](https://doc.twake.app)
[![Community](https://img.shields.io/badge/community-awesome-brightgreen?style=flat)](https://community.twake.app)
[![Twitter](https://img.shields.io/badge/twitter-%40twake-blue?style=flat)](https://twitter.com/twake) [![Join the chat at https://gitter.im/linagora/Twake](https://badges.gitter.im/linagora/Twake.svg)](https://gitter.im/linagora/Twake?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Twake is a secure open source collaboration platform to improve organizational productivity.
Twake offers all the features for collaboration :

- Team chat
- File Storage
- Team Calendar
- Task Management
- Video call and conferencing
- Real time document collaboration

<a href="https://twake.app"><img width=800 src="https://github.com/linagora/Twake/raw/main/twake.png"/></a>

## Demo

You can <a href="https://twake.app"> try Twake</a> in SaaS.

Or run your own local Twake instance with :

```bash
cd twake 
export COMPOSE_FILE=docker-compose.onpremise.yml
docker compose up -d
```

Twake will be running on http//localhost and by default redirect to https and uses a self-signed certificate. If you want to run http only then set SSL_CERTS=none at docker-compose.yml

## Documentation

Twake's documentation can be found at [doc.twake.app](https://doc.twake.app)

More information at twake.app : [twake.app](https://twake.app)

## Community

The Twake community is gathered on the forum: [community.twake.app](https://community.twake.app).

If you have any questions or suggestions, we will be happy to answer them.

### Translations

We use [Weblate](https://hosted.weblate.org/projects/twake/) for translation management. Create an account on weblate to improve our Twake internationalisation.

## How to contribute

Everyone can contribute at their own level, even if they only give a few minutes of their time. Whatever you do, your help is very valuable. Only thanks to you Twake can be a powerful software. Check out how you can help [twake.app/en/how-to-contribute/](https://twake.app/en/how-to-contribute/)

## Manual install of Twake

Install Twake on your machine with docker-compose using the install documentation here :
[doc.twake.app/installation](https://doc.twake.app/installation)

`cd twake; docker-compose -f docker-compose.onpremise.mongo.yml up -d`

Twake will be available on port 3000.

## License

Twake is licensed under [Affero GPL v3 with additional terms](https://github.com/TwakeApp/Twake/blob/main/LICENSE.md)
