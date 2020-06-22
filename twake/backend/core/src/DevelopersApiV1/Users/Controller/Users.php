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
            $object = $this->get("app.users")->getById($user_id);
        }

        return new Response(Array("object" => $object));

    }

    public function getNotifications(Request $request)
    {
      $result = Array("unred" => 0, "notifications" => Array());

      //TODO get user notifications

      return new Response($result);
    }

}
