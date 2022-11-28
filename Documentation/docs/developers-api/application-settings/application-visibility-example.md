---
description: This is a JSON parameter to define where your app should appear
---

# Display

#### Latest version

```typescript
{
  twake: {
    version: 1;

    files?: {
      preview?: {
        url: string; //Url to preview file (full screen or inline)
        inline?: boolean;
        main_ext?: string[]; //Main extensions app can read
        other_ext?: string[]; //Secondary extensions app can read
      };
      actions?: //List of action that can apply on a file
      {
        name: string;
        id: string;
      }[];
    };

    //Chat plugin
    chat: {
      input?:
        | true
        | {
            icon?: string; //If defined replace original icon url of your app
            type?: "file" | "call"; //To add in existing apps folder / default icon
          };
      commands?: {
        command: string; // my_app mycommand
        description: string;
      }[];
      actions?: //List of action that can apply on a message
      {
        name: string;
        id: string;
      }[];
    };

    //Allow app to appear as a bot user in direct chat
    direct?:
      | true
      | {
          name?: string;
          icon?: string; //If defined replace original icon url of your app
        };

    //Display app as a standalone application in a tab
    tab?: {
      url: string;
    };

    //Display app as a standalone application on the left bar
    standalone?: {
      url: string;
    };

    //Define where the app can be configured from
    configuration: ("global" | "channel")[];
  };
};

```

#### Legacy format

```javascript
type ApplicationDisplay = {
  twake: 
    {
      "version": 0, //Legacy
      "tasks_module" : {
        "can_connect_to_tasks": true
    	},
      "calendar_module" : {
        "can_connect_to_calendar": true
    	}
    	"drive_module" : {
        "can_connect_to_directory": true,
        "can_open_files": {
    			"url": "", //Une url à appeler pour éditer le fichier (ouvert dans un onglet)
    			"preview_url": "", //Une url à appeler pour prévisualiser un fichier (iframe)
    			"main_ext": ["docx", "xlsx"], //Extensions principales
    			"other_ext": ["txt", "html"] //Extensions secondaires
    		},
    		"can_create_files": [
    			{
    				"url": "https://[...]/empty.docx",
    				"filename": "Untitled.docx",
    				"name": "Word Document"
    			},
          {
    				"url": "https://[...]/empty.xlsx",
    				"filename": "Untitled.xlsx",
    				"name": "Excel Document"
    			}
    		]
      },
      "member_app": true, // Si défini, votre application génèrera un membre
                          // virtuel dans l'espace de travail avec lequel les
                          // utilisateurs pourront discuter.
      "messages_module": {
        "in_plus": {
          "should_wait_for_popup": true
        },
        "right_icon": {
    			"icon_url": "", //If defined replace original icon url of your app 
          "should_wait_for_popup": true,
          "type": "file" //"file" | "call"
        },
        "action": {
          "should_wait_for_popup": true,
          "description": "fdsqfds" //Description de l'action, sinon remplacé par le nom de l'app
        },
        "commands": [
    			{
    				"command": "mycommand", // my_app mycommand
            "description": "fdsqfds"
    			}
    		]
      },
      "channel": {
        "can_connect_to_channel": ""
      },
      "channel_tab": {
        "iframe": ""
      },
      "app": {
        "iframe": "",
        "plus_btn": {
          "should_wait_for_popup": true
        }
      },
      "configuration": {
        "can_configure_in_workspace": true,
        "can_configure_in_channel": true,
    		"can_configure_in_calendar": true,
    		"can_configure_in_tasks": true,
        //"can_configure_in_directory": true
      }
    }
  }
}
```

