<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 05/06/18
 * Time: 15:46
 */

namespace DevelopersApiV1\General\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class General extends BaseController
{

    public function closeConfigure(Request $request)
    {

        $capabilities = [];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        $user_id = $request->request->get("user_id", null);
        if (!$user_id) {
            return new Response(Array("error" => "missing_user_id"));
        }

        $connection_id = $request->request->get("connection_id", false);
        if (!$connection_id) {
            return new Response(Array("error" => "missing_connection_id"));
        }

        $event = Array(
            "connection_id" => $connection_id,
            "action" => "close_configure",
            "application" => $application->getAsArray()
        );
        $this->get("app.websockets")->push("updates/" . $user_id, $event);

        return new Response(Array("result" => "success"));

    }

    public function configure(Request $request)
    {

        $capabilities = ["display_modal"];

        $application = $this->get("app.applications_api")->getAppFromRequest($request, $capabilities);
        if (is_array($application) && $application["error"]) {
            return new Response($application);
        }

        //TODO Verify targeted user in in app requested group

        $user_id = $request->request->get("user_id", null);
        if (!$user_id) {
            return new Response(Array("error" => "missing_user_id"));
        }

        $connection_id = $request->request->get("connection_id", false);
        if (!$connection_id) {
            return new Response(Array("error" => "missing_connection_id"));
        }

        $form = $request->request->get("form", Array());
        $hidden_data = $request->request->get("hidden_data", Array());

        $event = Array(
            "connection_id" => $connection_id,
            "action" => "configure",
            "application" => $application->getAsArray(),
            "form" => $form,
            "hidden_data" => $hidden_data
        );
        $this->get("app.websockets")->push("updates/" . $user_id, $event);

        return new Response(Array("result" => "success"));

    }

}
