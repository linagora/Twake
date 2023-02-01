---
description: Knowledge-graph API
---

## Events sent by twake to the knowledge graph

### User created / updated

```typescript
{
    records: [
        {
            key: "null",
            value: {
                id: "User",
                properties: {
                    _kg_user_id: string; //Console wide user id (based on the console id), prefer to use this one
                    _kg_email_id: string; //Console wide user id (based on the email md5)
                    _kg_company_all_id: string[]; //All console wide companies_ids for this user

                    user_id: string; //Twake internal user id
                    company_id: string; //Company internal id
                    user_created_at: number;
                    user_last_activity: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                },
            },
        },
    ]
}
```

### Channel created / updated

```typescript
{
    records: [
        {
            key: "null",
            value: {
                id: "Channel",
                properties: {
                    _kg_user_id: string; //Console wide user id (based on the console id), prefer to use this one
                    _kg_email_id: string; //Console wide user id (based on the email md5)
                    _kg_company_id: string; //Console wide company id
                    channel_id: string;
                    channel_name: string;
                    channel_owner: string;
                    workspace_id: string;
                    company_id: string;
                },
            },
        },
    ],
}
```

### Message created / updated

```typescript
{
    records: [
        {
            key: "null",
            value: {
                id: "Message",
                properties: {
                    _kg_user_id: string; //Console wide user id (based on the console id), prefer to use this one
                    _kg_email_id: string; //Console wide user id (based on the email md5)
                    _kg_company_id: string; //Console wide company id
                    message_thread_id: message.thread_id,
                    message_content: string; //Empty if user requested not to share data to KG
                    message_created_at: number;
                    message_updated_at: number;
                    type_message: string;
                    company_id: string; //Internal to Twake company id
                    workspace_id: string;
                    channel_id: string;
                    user_id: string; //Internal to Twake user id
                },
            },
        },
    ],
}
```

### Company created / updated

```typescript
{
    records: [
        {
            key: "null",
            value: {
                id: "Company",
                properties: {
                    _kg_company_id: string; //Console wide company id
                    company_id: string; //Internal to Twake company id
                    company_name: string;
                },
            },
        },
    ],
}
```

### Workspace created / updated

```typescript
{
    records: [
        {
            key: "null",
            value: {
                id: "Workspace",
                properties: {
                    _kg_company_id: string; //Console wide company id
                    company_id: string; //Internal to Twake company id
                    workspace_id: string; //Internal to Twake workspace id
                    workspace_name: string;
                },
            },
        },
    ],
}
```

## Sending events to Twake from the KG

Twake listen at at:
`POST https://domain/internal/services/knowledge-graph/v1/push`

Authorised by a Token authorization header:
`Authorization: Token {some token defined together}`

And with the following data in JSON:

```typescript
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

```typescript
{
  "status": "success"
}
```
