<?php	

namespace Twake\Channels\Controller;	

use Common\BaseController;	
use Common\Http\Response;	
use Common\Http\Request;	

class Channels extends BaseController	
{	
    public function getAction(Request $request)	
    {	
        $options = $request->request->get("options");

        //This is only used now to get old "applications as channels" feature
        //$objects = $this->get("app.channels.channels_system")->get($options, $this->getUser());	
        $workspace = $this->get("app.workspaces")->get($options["workspace_id"]);
        $apps = $this->get("app.group_apps")->getApps($workspace->getGroup());

        $objects = [];
        foreach($apps as $app){
            $objects[] = [
                "app_bot_identifier" =>"",
                "app_group_id" =>"",
                "app_id" =>$app->getId(),
                "application" =>true,
                "channel_group_name" =>"",
                "connectors" =>[],
                "description" =>"",
                "direct" =>false,
                "ext_members" =>[],
                "front_id" => $app->getId(),
                "icon" =>"",
                "id" => $app->getId(),
                "last_activity" =>1626706970,
                "members" =>[$this->getUser()->getId()],
                "members_count" => null,
                "messages_increment" =>0,
                "name" =>"",
                "original_group" => $workspace->getGroup(),
                "original_workspace" => $options["workspace_id"],
                "private" =>false,
                "tabs" =>[]
            ];
        }

        if ($objects === false) {	
            return new Response(Array("status" => "error"));	
        }	
        return new Response(Array("data" => $objects));	
    }	

} 