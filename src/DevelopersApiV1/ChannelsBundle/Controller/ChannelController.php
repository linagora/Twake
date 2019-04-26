<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\ChannelsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class ChannelController extends Controller
{

    public function getDirectChannelAction(Request $request)
    {

        $capabilities = [];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }

        $user_id = $request->request->get("user_id", "");

        if ($user_id) {
            $user_entity = $this->get("app.users")->getById($user_id, true);
            if ($user_entity) {
                $object = $this->get("app.channels.direct_messages_system")->save(Array("app_id" => $application->getId(), "group_id" => $request->request->get("group_id", null)), Array(), $user_entity);
            }
        }

        return new JsonResponse(Array("object" => $object));

    }

    public function getChannelsByWorkspaceAction(Request $request)
    {
        $privileges = ["workspace"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new JsonResponse($application);
        }
        $user_id = $request->request->get("user_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id){
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if($user_entity) {
                $objects = $this->get("app.channels.channels_system")->get(Array("workspace_id" => $workspace_id), $user_entity);
            }
        }
        return new JsonResponse(Array("data" => $objects));
    }

}
