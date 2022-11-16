---
description: >-
  If you are here, you probably have a very great idea for Twake, like adding a
  brand new feature into Twake, maybe a coffee maker service ? ☕️
---

# Create a new service

{% hint style="info" %}
Please ensure you read the [Start working into a service](start-working-into-a-service.md) before
{% endhint %}

To create a new component, a new folder must be created under the `src/services` one and an `index.ts` file must export the a class. This class will be instantiated by the platform and will be linked to the required services automatically.

In order to illustrate how to create a component, let's create a fake Notification service.

1. Create the folder `src/services/notification`
2. Create an `index.ts` file which exports a `NotificationService` class

```javascript
// File src/services/notification/index.ts
import { TwakeService } from "../../core/platform/framework";
import NotificationServiceAPI from "./api.ts";

export default class NotificationService extends TwakeService<NotificationServiceAPI> {
  version = "1";
  name = "notification";
  service: NotificationServiceAPI;

  api(): NotificationServiceAPI {
    return this.service;
  }
}
```

1. Our `NotificationService` class extends the generic `TwakeService` class and we defined the `NotificationServiceAPI` as its generic type parameter. It means that in the platform, the other components will be able to retrieve the component from its name and then consume the API defined in the `NotificationServiceAPI` interface and exposed by the `api` method.

   We need to create this `NotificationServiceAPI` interface which must extend the `TwakeServiceProvider` from the platform like:

```javascript
// File src/services/notification/api.ts
import { TwakeServiceProvider } from "../../core/platform/framework/api";

export default interface NotificationServiceAPI extends TwakeServiceProvider {

  /**
   * Send a message to a list of recipients
   */
  send(message: string, recipients: string[]): Promise<string>;
}
```

1. Now that the interfaces are defined, we need to create the `NotificationServiceAPI` implementation \(this is a dummy implementation which does nothing but illustrates the process\):

```javascript
// File src/services/notification/services/api.ts
import NotificationServiceAPI from "../api";

export class NotificationServiceImpl implements NotificationServiceAPI {
  version = "1";

  async send(message: string, recipients: string[]): Promise<string> {
    return Promise.resolve(`${message} sent`);
  }
}
```

1. `NotificationServiceImpl` now needs to be instanciated from the `NotificationService` class since this is where we choose to keep its reference and expose it. There are several places which can be used to instanciate it, in the constructor itself, or in one of the `TwakeService` lifecycle hooks. The `TwakeService` abstract class has several lifecycle hooks which can be extended by the service implementation for customization pusposes:
2. `public async doInit(): Promise<this>;` Customize the `init` step of the component. This is generally the place where services are instanciated. From this step, you can retrieve services consumed by the current component which have been already initialized by the platform.
3. `public async doStart(): Promise<this>;` Customize the `start` step of the component. You have access to all other services which are already started.

```javascript
// File src/services/notification/index.ts
import { TwakeService } from "../../core/platform/framework";
import NotificationServiceAPI from "./api.ts";
import NotificationServiceImpl from "./services/api.ts";

export default class NotificationService extends TwakeService<NotificationServiceAPI> {
  version = "1";
  name = "notification";
  service: NotificationServiceAPI;

  api(): NotificationServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    this.service = new NotificationServiceImpl();

    return this;
  }
}
```

1. Now that the service is fully created, we can consume it from any other service in the platform. To do this, we rely on Typescript decorators to define the links between components. For example, let's say that the a `MessageService` needs to call the `NotificationServiceAPI`, we can create the link with the help of the `@Consumes` decorator and get a reference to the `NotificationServiceAPI` by calling the `getProvider` on the component context like:

```javascript
import { TwakeService, Consumes } from "../../core/platform/framework";
import MessageServiceAPI from "./providapier";
import NotificationServiceAPI from "../notification/api";

@Consumes(["notification"])
export default class MessageService extends TwakeService<MessageServiceAPI> {

  public async doInit(): Promise<this> {
    const notificationService = this.context.getProvider<NotificationServiceAPI>("notification");

    // You can not call anything defined in the NotificationServiceAPI interface from here or from inner services by passing down the reference to notificationService.
  }
}
```

**Configuration**

The platform and services configuration is defined in the `config/default.json` file. It uses [node-config](https://github.com/lorenwest/node-config) under the hood and to configuration file inheritence is supported in the platform.

The list of services to start is defined in the `services` array like:

```javascript
{
  "services": ["auth", "user", "channels", "webserver", "websocket", "database", "realtime"]
}
```

Then each service can have its own configuration block which is accessible from its service name i.e. `websocket` service configuration is defined in the `websocket` element like:

```javascript
{
  "services": ["auth", "user", "channels", "webserver", "websocket", "orm"],
  "websocket": {
    "path": "/socket",
    "adapters": {
      "types": [],
      "redis": {
        "host": "redis",
        "port": 6379
      }
    }
  }
}
```

On the component class side, the configuration object is directly accessible from the `configuration` property like:

```javascript
export default class WebSocket extends TwakeService<WebSocketAPI> {
  async doInit(): Promise<this> {
    // get the "path" value, defaults to "/socket" if not defined
    const path = this.configuration.get < string > ("path", "/socket");

    // The "get" method is generic and can accept custom types like
    const adapters = this.configuration.get < AdaptersConfiguration > "adapters";
  }
}

interface AdaptersConfiguration {
  types: Array<string>;
  redis: SocketIORedis.SocketIORedisOptions;
}
```

{% hint style="info" %}
After creating a new service, you can add controllers, business services and entities, go back to the [What is a service section](start-working-into-a-service.md)
{% endhint %}

## Create a new technical service

Now you are bringing things a step further, you are going to add new core services in Twake, like for instance a new database connector or encryption system.

Creating a new core service is as easy as creating a functional service. But it must be in `src/core/platform/services` .

You can read the [complete list of existing technical services here](platform/) .

