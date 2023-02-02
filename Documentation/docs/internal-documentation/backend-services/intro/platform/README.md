---
description: >-
  List of core shared components in Twake backend, available in
  src/core/platform/services
---

# Platform/Technical services

## **Database Technical Service**

Twake uses a custom ORM to work with both MongoDB and CassandraDB/ScyllaDB.

[database-orm-platform-service](database-orm-platform-service.md)

## **Realtime Technical Service**

The framework provides simple way to create CRUD Services which will notify clients using Websockets by following some conventions:

1. The service must implement the `CRUDService` generic interface
2. In order to push notification to clients, Typescript decorators must be added on methods \(Create, Update, Delete methods\)

For example, let's say that we want to implement a CRUD Service for `messages`:

```javascript
import {
  CRUDService,
  CreateResult,
  DeleteResult,
  UpdateResult,
  EntityId,
} from "@/core/platform/framework/api/crud-service";

class Message {
  text: string;
  createdAt: Date;
  author: string;
}

class MessageService implements CRUDService<Message> {
  async create(item: Message): Promise<CreateResult<Message>> {
    // save the message then return a CreateResult instance
  }

  async get(id: EntityId): Promise<Message> {
    // get the message from its ID and return it
  }

  async update(id: EntityId, item: Message): Promise<UpdateResult<Message>> {
    // update the message with the given id, patch it with `item` values
    // then return an instance of UpdateResult
  }

  async delete(id: EntityId): Promise<DeleteResult<Message>> {
    // delete the message from its id then return a DeleteResult instance
  }

  async list(): Promise<Message[]> {
    // get a list of messages
  }
}
```

By implementing the CRUD service following the API, we can now add realtime message to clients connected to Websocket on a selected collection of CRUD operations. For example, if we want to just notify when a `message` is created, we just have to add the right decorator on the `create` method like:

```javascript
import { RealtimeCreated } from "@/core/platform/framework/decorators";

// top and bottom code removed for clarity
class MessageService implements CRUDService<Message> {

  @RealtimeCreated<Message>({
    room: "/messages",
    path: message => `/messages/${message.id}`
  })
  async create(item: Message): Promise<CreateResult<Message>> {
    // save the message then return a CreateResult instance
    const created: Message = new Message(/* */);

    return new CreateResult<Message>("message", created)
  }
  // ...
}
```

The `RealtimeCreated` decorator will intercept the `create` call and will publish an event in an internal event bus with the creation result, the input data and the `"/messages"` path. On the other side of the event bus, an event listener will be in charge of delivering the event to the right Websocket clients as described next.

The Realtime\* decorators to add on methods to intercept calls and publish data are all following the same API. A decorator takes two parameters as input:

- First one is the room name to publish the notification to \(`/messages` in the example above\)
- Second one is the full path of the resource linked to the action \(`message => /messages/${message.id}` in the example above\)

Both parameters can take a string or an arrow function as parameter. If arrow function is used, the input parameter will be the result element. By doing this, the paths can be generated dynamically at runtime.

## **Websocket Technical Service**

Services annotated as described above automatically publish events to WebSockets. Under the hood, it uses Socket.IO rooms to send events to the right clients.

**Authentication**

- Client have to provide a valid JWT token to be able to connect and be authenticated by providing it as string in the `authenticate` event like `{ token: "the jwt token value" }`
- If the JWT token is valid, the client will receive a `authenticated` event
- If the JWT token is not valid or empty, the client will receive a `unauthorized` event

**Example**

```javascript
const io = require("socket.io-client");

// Get a JWT token from the Twake API first
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOjEsImlhdCI6MTYwMzE5ODkzMn0.NvQoV9KeWuTNzRvzqbJ5uZCQ8Nmi2rCYQzcKk-WsJJ8";
const socket = io.connect("http://localhost:3000", { path: "/socket" });

socket.on("connect", () => {
  socket
    .emit("authenticate", { token })
    .on("authenticated", () => {
      console.log("User Authenticated");
    })
    .on("unauthorized", (err) => {
      console.log("User is not authorized", err);
    });
});

socket.on("disconnected", () => console.log("Disconnected"));
```

**Joining rooms**

CRUD operations on resources are pushing events in Socket.io rooms. In order to receive events, clients must subscribe to rooms by sending an `realtime:join` on an authenticated socket with the name of the room to join and with a valid JWT token like `{ name: "room name", token: "the jwt token for this room" }`: Users can not subscribe to arbitratry rooms, they have to be authorized to.

As a result, the client will receive events:

- `realtime:join:success` when join is succesful with data containing the name of the linked room like `{ name: "room" }`.
- `realtime:join:error` when join failed with data containing the name of the linked room and the error details like `{ name: "room", error: "some error message" }`.

**Example**

```javascript
const io = require("socket.io-client");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOjEsImlhdCI6MTYwMzE5ODkzMn0.NvQoV9KeWuTNzRvzqbJ5uZCQ8Nmi2rCYQzcKk-WsJJ8";
const socket = io.connect("http://localhost:3000", { path: "/socket" });

socket.on("connect", () => {
  socket
    .emit("authenticate", { token })
    .on("authenticated", () => {
      // join the /channels room
      socket.emit("realtime:join", { name: "/channels", token: "twake" });
      socket.on("realtime:join:error", (message) => {
        // will fire when join does not provide a valid token
        console.log("Error on join", message);
      });

      // will be fired on each successful join.
      // As event based, this event is not linked only to the join above
      // but to all joins. So you have to dig into the message to know which one
      // is successful.
      socket.on("realtime:join:success", (message) => {
        console.log("Successfully joined room", message.name);
      });
    })
    .on("unauthorized", (err) => {
      console.log("Unauthorized", err);
    });
});

socket.on("disconnected", () => console.log("Disconnected"));
```

**Leaving rooms**

The client can leave the room by emitting a `realtime:leave` event with the name of the room given as `{ name: "the room to leave" }`.

As a result, the client will receive events:

- `realtime:leave:success` when leave is succesful with data containing the name of the linked room like `{ name: "room" }`.
- `realtime:leave:error` when leave failed with data containing the name of the linked room and the error details like `{ name: "room", error: "some error message" }`.

Note: Asking to leave a room which has not been joined will not fire any error.

**Example**

```javascript
socket.on("connect", () => {
  socket.emit("authenticate", { token }).on("authenticated", () => {
    // leave the "/channels" room
    socket.emit("realtime:leave", { name: "/channels" });

    socket.on("realtime:leave:error", (message) => {
      // will fire when join does not provide a valid token
      console.log("Error on leave", message);
    });

    // will be fired on each successful leave.
    // As event based, this event is not linked only to the leave above
    // but to all leaves. So you have to dig into the message to know which one
    // is successful.
    socket.on("realtime:leave:success", (message) => {
      console.log("Successfully left room", message.name);
    });
  });
});
```

**Subscribe to resource events**

Once the given room has been joined, the client will receive `realtime:resource` events with the resource linked to the event as data:

```javascript
{
  "action": "created",
  "room": "/channels",
  "type": "channel",
  "path": "/channels/5f905327e3e1626399aaad79",
  "resource": {
    "name": "My channel",
    "id": "5f905327e3e1626399aaad79"
  }
```

**Example:**

```javascript
socket.on("connect", () => {
  socket
    .emit("authenticate", { token })
    .on("authenticated", () => {
      // join the "/channels" room
      socket.emit("realtime:join", { name: "/channels", token: "twake" });

      // will only occur when an action occured on a resource
      // and if and only if the client joined the room
      // in which the resource is linked
      socket.on("realtime:resource", (event) => {
        console.log("Resource has been ${event.action}", event.resource);
      });
    })
    .on("unauthorized", (err) => {
      console.log("Unauthorized", err);
    });
});
```
