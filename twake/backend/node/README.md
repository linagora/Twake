# Twake backend

## Developer guide

### Getting started

1. Clone and install dependencies (assumes that you have Node.js 12 and npm installed):

  ```sh
  git clone git@github.com:TwakeApp/Twake.git
  cd Twake/Twake/backend/node
  npm install
  ```

2. Run in watch mode (will restart on each change)

  ```sh
  npm run watch
  ```

3. Backend is now running and available on [http://localhost:3000](http://localhost:3000)

### Component Framework

The backend is developed using a software component approach in order to compose and adapt the platform based on needs and constraints.
The current section describes this approach, and how to extend it by creating new components.

The platform has the following properties:

- A platform is composed of multiple components
- A component has an unique name in the platform
- A component can provide a `service`
- A component can consume `services` from other components
- A component has a lifecycle composed of several states: `ready`, `initialized`, `started`, `stopped`
- A component lifecycle changes when a lifecycle event is triggered by the platform: `init`, `start`, `stop`
- By creating links between components (service producers and consumers), components lifecycles **are also linked together**: A component going from `ready` to `initialized` will wait for all its dependencies to be in `initialized` state. This is automatically handled by the platform.

The platform currently have some limitations:

- Components can not have cyclic dependencies: if `component X` requires a component which requires `component X` directly or in one of its dependencies, the platform will not start
- Components can only have local dependencies.

#### Creating a new component

To create a new component, a new folder must be created under the `src/services` one and an `index.ts` file must export the a class. This class will be instantiated by the platform and will be linked to the required services automatically.

In order to illustrate how to create a component, let's create a fake Notification service.

1. Create the folder `src/services/notification`
2. Create an `index.ts` file which exports a `NotificationService` class

  ```js
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

3. Our `NotificationService` class extends the generic `TwakeService` class and we defined the `NotificationServiceAPI` as its generic type parameter. It means that in the platform, the other components will be able to retrieve the component from its name and then consume the API defined in the `NotificationServiceAPI` interface and exposed by the `api` method.
We need to create this `NotificationServiceAPI` interface which must extend the `TwakeServiceProvider` from the platform like:

  ```js
  // File src/services/notification/api.ts
  import { TwakeServiceProvider } from "../../core/platform/framework/api";

  export default interface NotificationServiceAPI extends TwakeServiceProvider {

    /**
     * Send a message to a list of recipients
     */
    send(message: string, recipients: string[]): Promise<string>;
  }
  ```

4. Now that the interfaces are defined, we need to create the `NotificationServiceAPI` implementation (this is a dummy implementation which does nothing but illustrates the process):

  ```js
  // File src/services/notification/services/api.ts
  import NotificationServiceAPI from "../api";

  export class NotificationServiceImpl implements NotificationServiceAPI {
    version = "1";

    async send(message: string, recipients: string[]): Promise<string> {
      return Promise.resolve(`${message} sent`);
    }
  }
  ```

5. `NotificationServiceImpl` now needs to be instanciated from the `NotificationService` class since this is where we choose to keep its reference and expose it. There are several places which can be used to instanciate it, in the constructor itself, or in one of the `TwakeService` lifecycle hooks. The `TwakeService` abstract class has several lifecycle hooks which can be extended by the service implementation for customization pusposes:
  - `public async doInit(): Promise<this>;` Customize the `init` step of the component. This is generally the place where services are instanciated. From this step, you can retrieve services consumed by the current component which have been already initialized by the platform.
  - `public async doStart(): Promise<this>;` Customize the `start` step of the component. You have access to all other services which are already started.

  ```js
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

6. Now that the service is fully created, we can consume it from any other service in the platform. To do this, we rely on Typescript decorators to define the links between components. For example, let's say that the a `MessageService` needs to call the `NotificationServiceAPI`, we can create the link with the help of the `@Consumes` decorator and get a reference to the `NotificationServiceAPI` by calling the `getProvider` on the component context like:

  ```js
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

#### Configuration

The platform and services configuration is defined in the `config/default.json` file. It uses [node-config](https://github.com/lorenwest/node-config) under the hood and to configuration file inheritence is supported in the platform.

The list of services to start is defined in the `services` array like:

```json
{
  "services": ["auth", "user", "channels", "webserver", "websocket", "orm"]
}
```

Then each service can have its own configuration block which is accessible from its service name i.e. `websocket` service configuration is defined in the `websocket` element like:

```json
{
  "services": ["auth", "user", "channels", "webserver", "websocket", "orm"],
  "websocket": {
    "path": "/ws",
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

```js
export default class WebSocket extends TwakeService<WebSocketAPI> {
  async doInit(): Promise<this> {
    // get the "path" value, defaults to "/ws" if not defined
    const path = this.configuration.get<string>("path", "/ws");

    // The "get" method is generic and can accept custom types like
    const adapters = this.configuration.get<AdaptersConfiguration>("adapters");
  }
}

interface AdaptersConfiguration {
  types: Array<string>,
  redis: SocketIORedis.SocketIORedisOptions
}
```

### ORM

We use [TypeORM](https://typeorm.io/) as ORM for all the services of the Twake backend. There are several guidelines to follow in order to manage entities and listeners as described below.

#### Entities

1. Entities have to be defined in folders named `entities`. This comes from the typeorm API which does not allow to register new entities at runtime but allows to define `glob` expression to lookup entities in folders.
2. Entities must follow the typeorm declaration as defined in the [entity documentation](https://typeorm.io/#/entities).

```js
import { Entity, Column, ObjectID, ObjectIdColumn } from "typeorm";

@Entity({ name: "channels" })
export class Channel {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  name: string;
}
```

#### Subscribers

TypeORM allows to create [subscribers](https://typeorm.io/#/listeners-and-subscribers) as [classes](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber) which will be called on defined events.
As for the entities, the subscribers must follow some TypeORM rules and restrictions:

1. Subscribers has to be defined in folders named `entities` and file name must contain `subscriber`.
2. Subscribers must implement the `EntitySubscriberInterface` interface and have be annotated with the `@EventSubscriber` decorator.
3. It is up to the developer to add the `after*()` and `before*()` event listeners.
4. The subscriber is instanciated by TypeORM, so this is not easy to inject some services in it as is for now.

```js
import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from "typeorm";
import { Channel } from "./channel";

@EventSubscriber()
export class ChannelSubscriber implements EntitySubscriberInterface<Channel> {

  /* This is required to define which entity this listener listens to */
  listenTo(): Function {
    return Channel;
  }

  afterInsert(event: InsertEvent<Channel>): void {
    console.log("Channel has been created", event.entity);
  }
}
```
