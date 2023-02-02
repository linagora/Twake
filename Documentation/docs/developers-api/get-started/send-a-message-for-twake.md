---
description: Send a message through API
---

# Send a message with your application

\
Introduction: <a href="#introduction" id="introduction"></a>

---

This guide will introduce you to send message with your application in Twake.

## Prerequisites: <a href="#prerequisites" id="prerequisites"></a>

- You have already created a Twake application.
- _Your application is installed and saved in your company._

## Steps: <a href="#steps" id="steps"></a>

### 1. Send message as a new Thread&#x20;

- Find the app's token according to [1. Log your Application](authenticate-postman.md#1.-log-your-application)
- Find the identifiers to target a channel:
  - Company's _id: $COMPANY_ID_
  - Workspace's \_id: $WOKSPACE\_\_ID
  - Channel's _id: $CHANNEL_ID_
- _Set the message you want to send:_

  - _Minimal:_&#x20;

    _$MESSAGE = { "text": "Hello world !" }_

  - _To take full advantage of the messages capability in Twake see the_ [_MessageObject_](../../internal-documentation/backend-services/messages/database-model.md)\_\_

- Send POST request with :&#x20;
  - Url: https://web.twake.app/api/messages/v1/companies/$COMPANY\_ID/threads
  - Headers: `{ "Content-Type": "application/json",` Authorization: "`Bearer " +  $APP_TOKEN }`
  - Body: `{ resource: { participants: [ { type: "channel", id: $CHANNEL_ID, company_id: $COMPANY_ID, workspace_id: $WORKSPACE_ID, }, ], }, options: { $MESSAGE }, }`
- This POST request will return a [ThreadObject](../../internal-documentation/backend-services/messages/database-model.md)

### 2. Send message as a Thread answer

- Find the app's token according to [1. Log your Application](authenticate-postman.md#1.-log-your-application)
- Find the identifiers to target a channel:
  - Company's _id: $COMPANY_ID_
  - Workspace's \_id: $WOKSPACE\_\_ID
  - Channel's _id: $CHANNEL_ID_
  - _Thread's id: $THREAD_Id_
- _Set the message you want to send:_

  - _Minimal:_&#x20;

    _$MESSAGE = { "text": "Hello world !" }_

  - _To take full advantage of the messages capability in Twake see the_ [_MessageObject_](../../internal-documentation/backend-services/messages/database-model.md)\_\_

- Send POST request with :&#x20;
  - Url: https://web.twake.app/api/messages/v1/companies/$COMPANY_ID/threads/$THREAD\__ID
  - Headers: `{ "Content-Type": "application/json",` Authorization: "`Bearer " +  $APP_TOKEN }`
  - Body: `{ resource: { $MESSAGE } }`
- This POST request will return a [MessageObject](../../internal-documentation/backend-services/messages/database-model.md)

### 3. Applications can send customized messages&#x20;

The [MessageObject](../../internal-documentation/backend-services/messages/database-model.md) object have a property called "block" that allow your application to send messages which contains more than a simple string. For example in an application message you can display an iFrame, buttons, menu selector, etc... Combining all this options you can create everything you want up to the limit of your imagination. To understand how to create powerful message using the block property see [blocks](../blocks.md).
