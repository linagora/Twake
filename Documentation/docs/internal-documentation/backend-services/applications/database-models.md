---
description: Application models for backend
---

# Database models

**applications**\
****Represent an application in the database

```javascript
{
  //PK
  "company_id": uuid;
  "id": uuid;

  "identity": ApplicationIdentity;
  "api": ApplicationApi;
  "access": ApplicationAccess;
  "display": ApplicationDisplay;
  "publication": ApplicationPublication;
  "stats": ApplicationStatistics;
}

type ApplicationIdentity = {
  name: string;
  iconUrl: string;
  description: string;
  website: string;
  categories: string[];
  compatibility: "twake"[];
};

type ApplicationPublication = {
  published: boolean;
};

type ApplicationStatistics = {
  createdAt: number;
  updatedAt: number;
  version: number;
};

type ApplicationApi = {
  hooksUrl: string;
  allowedIps: string;
  privateKey: string;
};

type ApplicationAccess = {
  privileges: string[];
  capabilities: string[];
  hooks: string[];
};

type ApplicationDisplay = {
  twake: {
    "version": 1,

		"files" : {
	    "preview": {
				"url": "", //Url to preview file (full screen or inline)
				"inline": true,
				"main_ext": ["docx", "xlsx"], //Main extensions app can read
				"other_ext": ["txt", "html"] //Secondary extensions app can read
			},
			"actions": [ //List of action that can apply on a file
				{
					"name": "string",
					"id": "string"
				}
			]
	  },

		//Chat plugin
	  "chat": {
	    "input": {
				"icon": "", //If defined replace original icon url of your app 
	      "type": "file" | "call" //To add in existing apps folder / default icon
	    },
	    "commands": [
				{
					"command": "mycommand", // my_app mycommand
	        "description": "fdsqfds"
				}
			],
			"actions": [ //List of action that can apply on a message
				{
					"name": "string",
					"id": "string"
				}
			]
	  },

		//Allow app to appear as a bot user in direct chat
    "direct": {
			"name": "My app Bot",
      "icon": "", //If defined replace original icon url of your app
    },

		//Display app as a standalone application in a tab
	  "tab": {
	    "url": ""
	  },

		//Display app as a standalone application on the left bar
	  "standalone": {
	    "url": ""
	  },

    //Define where the app can be configured from
	  "configuration": ["global", "channel"]
  };
};
```



**company\_application**\
****Represent an application in a company

```javascript
{
	"company_id": uuid;
	"application_id": uuid;
	"id": uuid;
	
	"created_at": number;
	"created_by": string; //Will be the default delegated user when doing actions on Twake
}
```
