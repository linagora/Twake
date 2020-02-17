<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\Channels\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class Channel extends BaseController
{

    public function getDirectChannel(Request $request)
    {

        $capabilities = [];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $user_id = $request->request->get("user_id", "");

        if ($user_id) {
            $user_entity = $this->get("app.users")->getById($user_id, true);
            if ($user_entity) {
                $object = $this->get("app.channels.direct_messages_system")->save(Array("app_id" => $application->getId(), "group_id" => $request->request->get("group_id", null)), Array(), $user_entity);
            }
        }

        $this->get("administration.counter")->incrementCounter("total_api_messages_operation", 1);

        return new Response(Array("object" => $object));

    }

    public function getChannelsByWorkspace(Request $request)
    {
        $privileges = ["channels"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, [], $privileges);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }
        $objects = false;
        $user_id = $request->request->get("user_id", "");
        $workspace_id = $request->request->get("workspace_id", "");
        if ($workspace_id) {
            if ($user_id) {
                $user_entity = $this->get("app.users")->getById($user_id, true);
            }
            if ($user_entity) {
                $objects = $this->get("app.channels.channels_system")->get(Array("workspace_id" => $workspace_id), $user_entity);
            }
        }

        if ($objects === false) {
            return new Response(Array("error" => "payload_error"));
        }

        $res = [];
        foreach ($objects as $object) {
            if (!$object["direct"] && !$object["application"]) {
                $res[] = $object;
            }
        }

        $this->get("administration.counter")->incrementCounter("total_api_messages_operation", 1);

        return new Response(Array("data" => $res));
    }

}
