---
description: >-
  You want to create an application for Twake? It's easy, just follow the steps
  in this documentation! 😀
---

# Create your first application

## Introduction:

This guide will walk you through creating, setting up and installing a Twake application.

## Prerequisites:

* _You are a **manager** of the company._

## Steps:

### 1. Create a Twake application

![ Fastest way to create an app](../../.gitbook/assets/twake-create-a-twake-app.gif)

1. _Start by opening your `Workspace settings`_
2. _Go to `Applications and connectors`, you should see an **Installed applications area** and **Applications developed by the company**,_
3. _Click on `Access your applications and connectors` then `Create an application`,_
4. _Enter your application name and application group._&#x20;

**Application group** is used to group your application with other applications of the same type. **Be careful, the application group will not be modifiable later.**

### **2. Identity of the application (Optional)**

![](../../.gitbook/assets/twake-identity-of-the-application.gif)

Let's add a description and an icon for our application. \
it will be much prettier! 😇

### 3. API settings

There you will find some important pieces of information:

![](../../.gitbook/assets/twake-api-settings.gif)

* _Your API private key,_
* _Your public application identifier,_
* _URL that will be used to receive events for your application,_
* _List of IP addresses that have the right to call the Twake API with your credentials. (You can use `*`during the development of your application.)_

**Private key** and **Public application identifier** ​​relate to **calls to the Twake API**.

### 4. Display settings (Optional)

![You can fill your JSON object here](../../.gitbook/assets/twake-display-settings.png)

To configure where your application should display, you need to fill a `JSON` object in `Display Settings` field.

[Here](../application-settings/application-visibility-example.md) is a quick example, each field is optional and his presence determines the positioning of your application in Twake.

### 5. Application privileges

![](../../.gitbook/assets/twake-application-privileges.gif)

Your application can access and modify data, only according to your needs you don't need to access all the data present in Twake. \
\
This is why you must specify the accesses for the proper functioning of your application. These accesses will be public and indicated to the user before the installation of your application.

In our example, we will only add  `message_save` and `message_remove` in `Write privileges`.\
\
If you want to know more about capabilities and privileges, take a look at the list [here](../application-settings/privileges.md).

### 6. Install application

Once you've configured your application, you need to install it on Twake.&#x20;

![](../../.gitbook/assets/twake-install-application.gif)

Go to `Applications and connectors`, search and display your application then install it.

Your application is now ready, check the [Authenticate with Postman](authenticate-postman.md) documentation for starting using it !
