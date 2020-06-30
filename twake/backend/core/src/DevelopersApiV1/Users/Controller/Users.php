<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\Users\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class Users extends BaseController
{

    public function getAction(Request $request)
    {

        $capabilities = [];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $user_id = $request->request->get("user_id", false);

        if ($user_id) {
            $object_orm = $this->get("app.users")->getById($user_id, true);
            $object = $object_orm->getAsArray();
            $object["email"] = $object_orm->getEmail();
        }

        return new Response(Array("object" => $object));

    }

    public function getNotifications(Request $request)
    {
      $result = Array("unread" => 0, "notifications" => Array());

      try{
        $user_id = $request->request->get("user_id");
        $user = null;
        if($user_id){
          $user = $this->get("app.users")->getById($user_id, true);
        }else{
          $user_email = $request->request->get("user_email");
          $user = $this->get("app.users")->getByEmail($user_email, true);
        }
        $limit = $request->request->get("limit", 30);

        $notifications = [];

        if($user){
          $workspaces_obj = $this->get("app.workspace_members")->getWorkspaces($user->getId() . "");
          if($workspaces_obj){
            $workspaces = Array();
            foreach ($workspaces_obj as $workspace_obj) {
                if($workspace_obj["hasnotifications"]){
                  //Add notifications in notification list
                  $workspace_infos = $workspace_obj["workspace"]->getAsArray();

                  $channels = $this->get("app.channels.channels_system")->get(["workspace_id"=>$workspace_infos["id"]], $user);

                  foreach ($channels as $channel) {
                    $unread = max(0, $channel["messages_increment"] - $channel["_user_last_message_increment"]);
                    if($unread > 0){
                      $notifications[] = [
                        "title" => $workspace_infos["name"] . " • " . $channel["name"],
                        "content" => $unread . " unread message(s)",
                        "date" => $channel["_user_last_access"] ?: $channel["last_activity"],
                        "url" => "/notification/-".$workspace_infos["id"]."-".$channel["id"]
                      ];
                    }
                  }
                }
            }
          }else{
            $notifications = [];
          }

          $channels = $this->get("app.channels.direct_messages_system")->get([], $user);
          foreach ($channels as $channel) {
            $unread = max(0, $channel["messages_increment"] - $channel["_user_last_message_increment"]);
            if($unread > 0){

              $name = [];
              foreach($channel["members"] as $member){
                if($member != $user->getId()){
                  $member_user = $this->get("app.users")->getById($member, true);
                  if($member_user){
                    $name[] = $member_user->getFullName();
                  }
                }
              }
              $name = join(", ", $name);

              $notifications[] = [
                "title" => $name,
                "content" => $unread . " unread message(s)",
                "date" => $channel["_user_last_access"] ?: $channel["last_activity"],
                "url" => "/notification/-".$channel["id"] //For private channels
              ];
            }
          }

        }

        usort($notifications, function ($a, $b) {
            return $b['date'] - $a['date'];
        });

        $result["unread"] = count($notifications);
        $result["notifications"] = array_slice($notifications, 0, $limit);

      }catch(\Exception $err){
        $result["unread"] = 0;
        $result["notifications"] = [];
        $result["error"] = $err->getMessage();
      }
      return new Response($result);
    }

}
