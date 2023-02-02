---
description: Notification database model
---

# Database models

#### **channel\_members\_notification\_preferences**

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"channel_id": "uuid-v4",
	"user_id": "uuid-v4",

	"preferences": "all" | "mentions" | "me" | "none",
	"last_read": 16000000, //Timestamp in seconds	
}
```

#### **channel\_thread\_users**

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"channel_id": "uuid-v4",
	"thread_id": "uuid-v4",

	"user_id": "uuid-v4"
}
```

#### **user\_notifications\_badges \(this is not a counter like scylladb counters here, just classic table\)**

```javascript
{
	//Primary key
	"company_id": "uuid-v4", (partition key)
	"user_id": "uuid-v4", (clustering key)
	"workspace_id": "uuid-v4", (clustering key)
	"channel_id": "uuid-v4", (clustering key)
	"thread_id": "uuid-v4", (clustering key)
}
```

#### **user\_notifications\_general\_preferences**

```javascript
{
	//Primary key
	"company_id": "uuid-v4",
	"user_id": "uuid-v4",
	"workspace_id": "uuid-v4",

	"preferences": PreferencesObject
}
```

