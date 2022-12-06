---
description: >-
  Welcome to the internal documentation section. This chapter is for developers
  working in Twake team or wanting to participate in the project.
---

# 🥇 Get started

> If you are looking for the Developers API of Twake to make plugins, apps or connectors, go here : [Developers API](../developers-api/home.md)

## Before to start

- Fork our repo [https://github.com/TwakeApp/Twake](https://github.com/TwakeApp/Twake) and checkout the **develop** branch

::: info
You want to fix a translation issue? We use Weblate: [https://hosted.weblate.org/projects/linagora/twake-chat-web/](https://hosted.weblate.org/projects/linagora/twake-chat-web/)
:::

## Run the backend (+ database)

1. Go to "twake/"
2. `docker-compose -f docker-compose.dev.mongo.yml up -d`
3. The backend will be running on port 3000

## Run the frontend

1. Go to "twake/frontend"
2. Run `yarn install` (better to use **yarn** than **npm**), our developers uses node 14 and 16, it should work with any upper version.
3. Prepare the **environment.ts** file like this: `cp environment/environment.ts.dist.dev environment/environment.ts`

```
export default {
  env_dev: true,
  front_root_url: 'http://localhost:3001',
  api_root_url: 'http://localhost:3000',
  websocket_url: 'ws://localhost:3000'
};
```

5\. Run `yarn start`

6\. It will propose to run on another port, say "yes" to run it on port 3001.

## Test and start develop

You should be able to go on localhost port 3001 just click on "create an account" and you'll be able to access Twake after a few steps.

\-> Logs from backend can be accessed from `docker-compose -f docker-compose.dev.mongo.yml logs -f --tail 100`

\-> Logs from frontend are visible in the output of `yarn start`

You can start writing code 🎉 ! It will reload the backend / frontend automatically each time you save.

::: danger
Before to start implementing a new feature or bug fix, please find or create an issue on our repository (here [https://github.com/linagora/Twake/issues](https://github.com/linagora/Twake/issues)) and put a comment to inform that you will work yourself on the issue. To avoid two same people doing the same work ;)
:::

::: info
If you have any issue, please come and join us on [https://community.twake.app/](https://community.twake.app)
:::

## Propose an improvement to be merged

For this you need to create a merge request on Github from your fork to our develop branch. Goes there: [https://github.com/linagora/Twake/compare](https://github.com/linagora/Twake/compare) and click "compare across forks".

Tests will be ran automatically and should pass before to merge the code.

::: info
We are hiring! Apply now on [https://job.linagora.com/en/join-us/](https://job.linagora.com/en/join-us/)
:::
