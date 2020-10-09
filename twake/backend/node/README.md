# Twake backend

## Developer guide

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
