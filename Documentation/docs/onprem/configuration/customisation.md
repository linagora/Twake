---
description: How to make Twake feel better in your company.
---

# 🎨 Customisation

> Customising Twake on SaaS \(web.twake.app\) is not available yet, contact sales to install an on-premise Twake version.

### Customise style and logos

You can customise Twake for your brand using the `configuration/backend/Parameters.php` file.

```text
"defaults" => [
  "branding" => [
    "header" => [
      "logo" => '', //Some logo used on header coloured background
      "apps" => [ //A list of apps accessible from header
        [
          "name"=> '', //App name
          "url"=> '', //Url to your app
          "icon"=> '', //App icon as image
        ],
      ],
    ],
    "style" => [
      "color" => '#2196F3', //Change default main color
      "default_border_radius" => '2', //Change default main border-radius
    ],
    "name" => "", //Brand name
    "enable_newsletter" => false, //Disable newsletter checkbox on subscribe
    "link" => "", //Link to your website (showed on login page)
    "logo" => "" //Coloured logo (white background)
  ]
]
```

### Customize apps

You can disable default apps with this command \(apps will not be installed on future new companies or workspaces\)

```text
"defaults" => [
  "applications" => [
    "twake_calendar" => false, //Not available
    "twake_tasks" => [ "default" => false ], //Available but not by default
    "twake_drive" => [ "default" => true ], //Available and by default in every new workspaces
    "connectors" => [
      "jitsi" => [ "default" => true ],
      "linshare" => false
    ]
  ]
]
```

After editing this configuration, **restart docker-compose** \(to import new configuration\) and type the following command:

```text
#docker-compose restart #To import new configuration
docker-compose exec php php bin/console twake:init
```



