---
description: How to manage messages through API
---

# Message

_While users have the ability to create message complexes using the built-in formatting system, applications can go even further and offer many types of messages such as system messages for notifications or interactive messages for your most popular applications._

## Group_id and channel_id:

1. Get the current front id:

   `channel_service.currentChannelFrontId`

2. With the channel front id, you will be able to get the channel id by doing this:

   `collections.collections.channels.manager.findByFrontId("My-Front-Id")`

3. Get the current group id:

   `workspaceService.currentGroupId`
