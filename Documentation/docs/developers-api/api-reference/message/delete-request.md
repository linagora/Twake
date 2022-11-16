---
description: This method allow to delete message to a specific channel.
---

# DELETE Request

#### Before starting, make sure you added ** `message_save` ** into **`write privileges`**. See the **** [Application access and privileges](../../get-started/#application-access-and-privileges) **** section.

{% swagger baseUrl="https://api.twake.app" path="/api/v1/messages/remove" method="post" summary="DELETE Message" %}
{% swagger-description %}

{% endswagger-description %}

{% swagger-parameter in="header" name="Content-Type" type="string" %}
`application/json`
{% endswagger-parameter %}

{% swagger-parameter in="header" name="Authorization" type="string" %}
`Basic base64(public_id:private_api_key)`
{% endswagger-parameter %}

{% swagger-parameter in="body" name="message" type="object" %}
`Require channel_id and content, see the body section`
{% endswagger-parameter %}

{% swagger-parameter in="body" name="group_id" type="string" %}
`See the group_id and the channel_id section`
{% endswagger-parameter %}

{% swagger-response status="200" description="if request is successful, the response should be something like this." %}
```
{
    "result": {
        "channel_id": "--", // Channel id
        "id": "--" // Deleted message id
    }
}
```
{% endswagger-response %}
{% endswagger %}

## Body example:&#x20;

```
{
	"group_id": "---", 
	"message": {
		"channel_id": "---",
		"id": "--" // Message id that you want to delete
	}
}
```
