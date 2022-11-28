---
description: Trigger action from command
---

# Trigger action from command

## Introduction: <a href="#introduction" id="introduction"></a>

This guide will introduce you to trigger action from your application using command

## Prerequisites: <a href="#prerequisites" id="prerequisites"></a>

* You have already created a Twake application.
* Your application is installed and saved in your company.

## Steps: <a href="#steps" id="steps"></a>

### 1. Let your application listen to command

* Go in your app developer's setting:&#x20;
  * Click on your username in the top left corner
  * Go to workspace settings&#x20;
  * Go to integrations&#x20;
  * Click on the three-dot next to your application
  * Open developper setting&#x20;
* Click on display&#x20;
* You will find and editable object containing a twake object
*   Add a new property commands in this object like this:

    * `"commands" : [{"command": string, "descritpion": string }]`
    * The first property of commands is command that let you define a name for your command, by default the command name is the name of your application.&#x20;
    * The second property of command is description that let you describe the way to use the command you want to define.



### 2. Use your command in a channel

* In the message editor write /command&#x20;
* A popup displaying the description on how to use the command related to your application should open.

__
