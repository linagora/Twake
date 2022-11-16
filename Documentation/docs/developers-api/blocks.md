# 🧱 Blocks

## Introduction: <a href="#introduction" id="introduction"></a>

This guide will introduce you to use blocks to custom Twake messages. Twake allows application to send customs messages. This customs messages offer the possibility for an application to easily format the text your application wants to send and/or display UI components like button, input or iframe.&#x20;

## Write your first block: <a href="#introduction" id="introduction"></a>

### 1. Take a look at slack block kit documentation&#x20;

* Go to this page: [Slack Block kit](https://api.slack.com/block-kit)
* Understand basic layers of block:
  *   Block

      First layer object, defining the use case of the current block (Actions, Context, Header, Files...). It can contain block elements and Composition object.&#x20;
  *   Block elements

      Second layer object, defining complex element that will be display in a block (Button, Menus, Input...). It can contain composition object
  *   Composition object&#x20;

      Third layer object, formatting the data to display in both block and/or block elements

### 2. Try your first block&#x20;

* Go to this page: [Block Kit Builder](https://app.slack.com/block-kit-builder)
* Try to add/remove block&#x20;
* Start writing block and check your result

### 3. Twake block&#x20;

Twake have some blocks that are not implemented in slack block kit (iframes, progress bar and copiable). To use them please follow this:&#x20;

#### iframe &#x20;

An iframe is **Block** allowing you to display an html page in twake.

How to use it:&#x20;

* Iframe type:&#x20;

```
type BlockIframe = { 
          type: "iframe";
          iframe_url: string; 
          width: number; 
          height: number; 
     };
```

* type: always "iframe"
* iframe\_url: the URL of the web page you want to display&#x20;
* width: the with that you iframe will take
* height: the height that you iframe will take

Example:&#x20;

```
{ 
    "blocks": [ 
        { 
            "type": "iframe", 
            "iframe_url": "
            https://twake.app
            ", 
            width: "40vh", 
            height: "40vh" 
        }
    ]
}
```

#### Copiable

A copiable is **Block element** is a readable only input allowing you to copy string with a button.

How to use it:&#x20;

* Copiable type: it is a plain text input block element with readonly and copiable set to true

```
type BlockElementPlaintextInput = {
  type: "plain_text_input";
  action_id: string;
  placeholder?: CompositionPlainTextObject;
  initial_value?: string;
  multiline?: boolean;
  min_length?: number;
  max_length?: number;
  dispatch_action_config?: DispatchActionConfiguration;
  readonly?: boolean;
  copiable?: boolean;
};
```

* type: always `"plain_text_input"`
* readonly: always `true`
* copiable: always `true`

Example :&#x20;

```
{ 
    "blocks": [ 
        {
            "type": "input",
            "element": {
                "type": "plain_text_input",
                "action_id": "plain_text_input-action",
                "initial_value": "https://twake.app"
                "readonly": true,
                "copiable": true,
            },
        }
    ]
}
```

#### Progress bar

A Progess bar is **Block element** that display a progress bar.

How to use it:&#x20;

* Progress bar type:

```
export type BlockElementProgressBar = {
  type: "progress_bar";
  value: number; 
  title: string;
};
```

* type: always `"progress_bar"`
* value: the value of your progress between 0 and 100
* title: the title associate to your progress bar

Example :&#x20;

```
{ 
    "blocks": [ 
        {
            "type": "progress_bar",
            "value": 50,
            "title": "Chargement" 
            
        }
    ]
}
```







&#x20;

