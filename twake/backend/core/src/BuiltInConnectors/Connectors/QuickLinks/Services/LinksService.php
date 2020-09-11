<?php

namespace BuiltInConnectors\Connectors\QuickLinks\Services;

class LinksService
{

    public function __construct($app) {
        $this->main_service = $app->getServices()->get("connectors.common.main");
    }

    public function generateForm($channel_id, $group_id, $user_id, $connection_id, $link) {

        $this->main_service->setConnector("quicklinks");
        $form = [
            [
                "type" => "input",
                "placeholder" => "Link name",
                "passive_id" => "name_link",
                "content" => $link['id'] ? $link['name'] : ""
            ],
            [
                "type" => "br"
            ],
            [
                "type" => "input",
                "placeholder" => "Url",
                "passive_id" => "url_link",
                "content" => $link['id'] ? $link['url'] : ""
            ],
            [
                "type" => "br"
            ],
            [
                "type" => "button",
                "style" => "primary",
                "content" => "save",
                "action_id" => "save_link",
                "interactive_context" => [
                    "channel_id" => $channel_id,
                    "link" => $link
                ]
            ]
        ];

        if (isset($link['id']) && $link['id'])
        {
            $delete =  [
                "type" => "button",
                "style" => "danger",
                "content" => "delete",
                "action_id" => "delete_link",
                "interactive_context" => [
                    "channel_id" => $channel_id,
                    "link_id" => $link['id'],
                ]
            ];
            $form[] = $delete;
        };

        $res = $this->main_service->postApi("general/configure", [
          "group_id"=> $group_id,
          "user_id"=> $user_id,
          "link" => $link,
          "user_id" => $user_id,
          "channel_id" => $channel_id,
          "connection_id" => $connection_id,
          "form" => $form,
          "hidden_data" => [
            "height" => "auto", //Optionnal
            "width" => "500px" //Optionnal
          ],
        ]);
  
        return true;
       
    }

    public function closeForm($group_id, $user_id, $connection_id) {
        $this->main_service->setConnector("quicklinks");

        $res = $this->main_service->postApi("general/configure_close", [
            "group_id" => $group_id,
            "user_id" => $user_id,
            "connection_id" => $connection_id
        ]);

        error_log(json_encode($res));

        return true;
    }

    public function saveLink($channel_id, $link) {
        $this->main_service->setConnector("quicklinks");

        
        $channel_container = $this->getLinks($channel_id, "");

        $id = isset($link["id"]) ? $link["id"] : ("link_".count($channel_container).date("U"));

        //search id
        $link["id"] = $id;
        $channel_container[$id] = $link;

        return $this->main_service->saveDocument($channel_id, $channel_container);
    }

    public function readLink($channel_id, $link_id) {
        $this->main_service->setConnector("quicklinks");

        if(isset($link_id)) {
            return array_values($this->getLinks($channel_id, $link_id));
        } else {
            return array_values($this->getLinks($channel_id,  $link_id));
        }
    }


    public function deleteLink($channel_id, $link) {
        $this->main_service->setConnector("quicklinks");

        $channel_container = $this->getLinks($channel_id, "");

        $new_list = [];
        foreach($channel_container as $item){
            if($item["id"] !== $link){
                $new_list[$item["id"]] = $item;
            }
        }

        return $this->main_service->saveDocument($channel_id, $new_list);
    }

    private function getLinks($context, $link_id){
        $channel_container = $this->main_service->getDocument($context);

        if($link_id) {
            foreach($channel_container as $item)
            {
                if (isset($item["id"]) && $item["id"] === $link_id)
                {
                    return $item;
                }
            }
        }

        if (!is_array($channel_container)) $channel_container = [];

        $final_channel_container = [];
        foreach($channel_container as $item)
        {
            if (isset($item["id"]))
            {
                $final_channel_container[$item["id"]] = $item;
            }
        }

        return $final_channel_container;
    }
}
