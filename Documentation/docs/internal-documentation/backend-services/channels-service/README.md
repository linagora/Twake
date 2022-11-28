---
description: >-
  Channels are topics in Twake, users can subscribe to them, can make them
  private or can create them.
---

# 🎩 Channels and tabs

### Wording

**Member:** member in company without the tag "guest"  
**Guest:** company member with the tag "guest"  
**Channel member:** member in the channel  
**Channels types:  
→ Private:** Relative to a workspace but restricted to a defined group of members  
**→ Public:** Relative to a workspace anyone can find the channel and join  
**→ Direct:** Relative to a company, a discussion between a set of members but without defined topic

**To understand the routing** please read **"**Collections based rest api:" in "Wording and formating"

TODO [Wording and formatting](https://www.notion.so/Wording-and-formatting-24ef27e094a042aea4899ac6a8039dee)

### What it does

Channel component is **not** responsible of the red badge counter \(notification service is\).

Channel component **is** responsible of keeping track of the message from where the user need to start reading but can be override by notification service if there is a mention to start reading from.

TODO [Some process details and constant s](https://www.notion.so/Some-process-details-and-constant-s-fb5b2d4974da490aa87bb87082af8454)

### Models an APIs

[Database models](database-models.md)

TODO [REST Api / Websockets Api](https://www.notion.so/REST-Api-Websockets-Api-458b153a6a6e46c2925dfc1db3859d3b)

TODO [In/Out microservice](https://www.notion.so/In-Out-microservice-e721e72e542244a69ca3a913e0b405ad)

TODO [Activity models](https://www.notion.so/Activity-models-0fa3acb0a13f41fd98bc98709908eedf)

