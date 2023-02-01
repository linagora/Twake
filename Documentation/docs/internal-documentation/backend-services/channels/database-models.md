---
description: Database models of channel
---

# Database models

## Channels

#### **channels**

The main channel table, this table should only be used when changing things on the channel \(not frequently\) so we don't add counters or last\_activity or anything like that.

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"workspace_id": "string" // ("uuid-v4" | "direct")
	"id": "uuid-v4",
	
	//Content
	"owner": "uuid-v4", //User-id of the channel owner (invisible but used on some access restriction-
	"icon": "String",
	"name": "String",
	"description": "String",
	"channel_group": "String",
	"visibility": "private" | "public" | "direct"
	"default": true | false, //The new members join by default this channel
	"archived": false | true,
	"archivation_date": 0, //Timestamp
}
```

#### **channel\_defaults**

Contain the default channels

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"workspace_id": "uuid-v4"

	"id": "uuid-v4" //Channel id
}
```

#### **channel\_counters**

We use a separated table to manage counters for this channel. Currently this is not used to do statistics but can be used to this goal in the future.

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"workspace_id": "string", // "uuid-v4" | "direct"
	"channel_id": "uuid-v4",
	"type": "members" | "guests" | "messages",

	"value": 0,
}
```

#### **channel\_last\_activity**

Store last channel activity for bold/not bold management

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"channel_id": "uuid-v4",

	"last_activity": 0, //Timestamp in seconds
}
```

#### **direct\_channel\_identifiers**

This table is used to find an existing discussion with a group of members. The "identifier" is generated from the group of members.

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"identifier": "string", // ordered CSV list of user ids
	"channel_id": "uuid-v4" //A way to find it in the channel table
}
```

## **Channels tabs**

#### **channel\_tabs**

Channels can have tabs that are connexion to other apps or different views.

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"workspace_id": "string", // "uuid-v4" | "direct"
	"channel_id": "uuid-v4",
	"tab_id": "uuid-v4",

	"name": "String", 
	"configuration": JSON,
	"application_id": "uuid-v4",
  "owner": "uuid-v4",
	"order": "string"
}
```

## **Channels members**

#### **channel\_members**

List of channels for an user

```javascript
{
	//Primary key
	"company_id": "uuid-v4", //Partition Key
	"workspace_id": "string", // "uuid-v4" | "direct", //Clustering key
	"user_id": "uuid-v4",
	"channel_id": "uuid-v4",

	"type": "member" | "guest" | "bot",

	"last_access": 0, //Timestamp in seconds
	"last_increment": 0, //Number
	"favorite": false | true, //Did the user add this channel to its favorites
	"notification_level": "all" | "none" | "group_mentions" | "user_mentions",
	"expiration": false | Timestamp, //Member expiration in channel (only for guests)
}
```

#### **channel\_members\_reversed**

List of users in channel

**Not implemented:** We need to ensure this replication regularly \(on each user open channel\) ?

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"workspace_id": "string", // "uuid-v4" | "direct",
	"channel_id": "uuid-v4",
	"type": "guest" | "bot" | "member",
	"user_id": "uuid-v4",
}
```

