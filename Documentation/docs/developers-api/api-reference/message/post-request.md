---
description: This method allow to send message to a specific channel.
---

# POST Request

#### Before starting, make sure you added ** `message_save` ** into **`write privileges`**. See the **** [Application access and privileges](../../get-started/#application-access-and-privileges) **** section.

{% swagger baseUrl="https://api.twake.app" path="/api/v1/messages/save" method="post" summary="POST message" %}
{% swagger-description %}

{% endswagger-description %}

{% swagger-parameter in="header" name="Authorization" type="string" %}
`Basic base64(public_id:private_api_key)`
{% endswagger-parameter %}

{% swagger-parameter in="header" name="Content-Type" type="string" %}
`application/json`
{% endswagger-parameter %}

{% swagger-parameter in="body" name="message" type="object" %}
`Require channel_id and content, see the Body section`
{% endswagger-parameter %}

{% swagger-parameter in="body" name="group_id" type="string" %}
`See the group_id and channel_id section`
{% endswagger-parameter %}

{% swagger-response status="200" description="If request is successful, the response should be something like this." %}
```
{
    "object": {
        "id": "--", // Message Id
        "channel_id": "--", // Channel
        "parent_message_id": "--", // Thread id
        "sender": null, // User who send the message
        "application_id": "--", // Application who send the message
        "edited": false, 
        "pinned": null,
        "hidden_data": null,
        "reactions": [],
        "modification_date": 1598518289, // Last modification date
        "creation_date": 1598518289, // Creation date
        "content": "Hello !", // Object (see Twacode) or string
    }
}
```
{% endswagger-response %}
{% endswagger %}

### Body example:&#x20;

```
{
	"group_id": "--",
	"message": {
		"channel_id": "--",
		"content": "Hello, this is my first message !",
		"_once_ephemeral_message": false // Set true if you want this message ephemeral
	}
}
```
