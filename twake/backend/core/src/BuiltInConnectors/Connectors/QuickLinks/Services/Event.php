<?php

namespace BuiltInConnectors\Connectors\QuickLinks\Services;

class Event
{

    public function __construct($app) {
        $this->main_service = $app->getServices()->get("connectors.common.main");
        $this->links_service = $app->getServices()->get("connectors.quicklinks.links_service");
    }

    public function proceedEvent($type, $event, $data)
    {

        if($type === 'interactive_configuration_action')
        {
            if($event === 'save_link') {
                $link["name"] = $data["form"]["name_link"] ? $data["form"]["name_link"] : $data["interactive_context"]["link"]["name"] ;
                $link["url"] = $data["form"]["url_link"] ? $data["form"]["url_link"] : $data["interactive_context"]["link"]["url"];
                $link["id"] = $data["interactive_context"]["link"]["id"] ? $data["interactive_context"]["link"]["id"] : null;
                
                $this->links_service->saveLink($data["interactive_context"]["channel_id"], $link);
            }

            if($event === 'delete_link') {
                $link_id = $data["interactive_context"]["link_id"];
                $channel_id = $data["interactive_context"]["channel_id"];

                $this->links_service->deleteLink($channel_id, $link_id);
            }

                
            $group_id = $data["group"]["id"];
            $user_id = $data["user"]["id"];
            $connection_id = $data["connection_id"];
            $this->links_service->closeForm($group_id, $user_id, $connection_id);
        }

    }
    

}
