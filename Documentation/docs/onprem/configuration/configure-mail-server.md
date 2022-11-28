---
description: To configure your mail serveur with Twake.
---

# 💌 Configure mail server

Here is the default mail block in the configuration file to edit \(from Parameters.php, see "[Configuration page](./)"\):

```text
"mail" => [
    "sender" => [
        "host" => "", //smtp server
        "port" => "",
        "username" => "",
        "password" => "",
        "auth_mode" => "plain" //plain, login, cram-md5, or null
    ],
    "from" => "noreply@twakeapp.com",
    "dkim" => [ //Optional, to avoid lost emails, configure your dns with dkim
        "private_key" => "",
        "domain_name" => '',
        "selector" => ''
    ],
    "twake_domain_url" => "https://twakeapp.com/",
    "from_name" => "Twake", //Server owner name
    "twake_address" => "Twake, 54000 Nancy, France", //Server owner address
    "template_dir" => "/src/Twake/Core/Resources/views/", //Must not be modified
],
```

⚠️ Once edited, don't forget to restart docker.

You can test the good behaviour of emails going into your account parameters, emails, add a secondary email. Or simply try to invite a user using its email.

