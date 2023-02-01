---
description: Knowledge-graph
---

# Twake to Knowledge-graph events

Twake can send events to the knowledge graph following this documentation:

[pushed-from-twake](./pushed-from-twake.md)

# Knowledge-graph to Twake REST

The knowledge graph can send us event at the following endpoint:
`POST https://api.twake.app/internal/services/knowledge-graph/v1/push`

Authorized by a Token authorization header:
`Authorization: Token {some token defined together}`

And with the following data in JSON:

```
{
  events: [KnowledgeGraphCallbackEvent, KnowledgeGraphCallbackEvent, KnowledgeGraphCallbackEvent, ...]
}

type KnowledgeGraphCallbackEvent = {
  recipients: {
    type: "user";
    id: string; // KG user id which is a md5 of the email
  }[];
  event: {
    type: "user_tags"; //More events will be added later
    data: {
      //For user_tags event only
      tags?: {
        value: string;
        weight: number;
      }[];
    };
  };
};

```

The reply will be if everything was alright:

```
{
  "status": "success"
}
```
