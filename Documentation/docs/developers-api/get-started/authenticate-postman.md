---
description: Postman example
---

# Authenticate with Postman

## Introduction:

This guide will introduce you to authenticate with [Postman](https://www.getpostman.com).

## Prerequisites:

* _You are a **manager** of the company._
* You have already [created a Twake application](create-your-first-application.md).
* _You have previously installed_ [_Postman_](https://www.getpostman.com)_._

## Steps:

### 1. Log your Application

* Open Postman&#x20;
* Find the app's credentials according to [#3.-api-settings](create-your-first-application.md#3.-api-settings "mention")
* Send POST request with :&#x20;
  * Url: https://web.twake.app/api/console/v1/login
  * Headers: `{ "Content-Type": "application/json", }`
  * Body: `{ id: $APP_`_`ID, secret: $APP_SECRET`_` ``}`
* This POST request will return a JWT token, this token will allow your application to send events in Twake

### 2. Optional: Verify your token

If you're not sure that the procedure to generate a token goes well :&#x20;

* Send GET request with :&#x20;
  * Url: https://web.twake.app/api/console/v1/me
  * Headers: `{ "Content-Type": "application/json",` Authorization: "`Bearer " +  $APP_TOKEN }`



### &#x20;
