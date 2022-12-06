---
description: How to manage authentification on API call
---

# Authentication

## Authencate your app in Twake

**All your connections** should respect the Basic access authentication protocol, which must be used via HTTPS, except in development mode. In order to make an API call with this method, you must add an HTTP header:

```text
Authorization: Basic base64(public_id:private_api_key)
```

**You must concatenate** your [public_id and private_api_key](../get-started/README.md#identity-and-api-settings) , **then convert** the whole **to base64**. Your HTTP header will therefore look like:

```text
# For the keys 'public_id' and 'private_key'
Authorization: Basic cHVibGljX2lkOnByaXZhdGVfYXBpX2tleQ==
```

## Authencate your app in a company

**All your requests should have at least a "group_id" key with the company id you**
