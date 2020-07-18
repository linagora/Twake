<?php

namespace Twake\Core\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Access extends BaseController
{

    public function has_access(Request $request)
    {

        $current_user = $this->getUser();
        $data = $request->request->get("data");
        $options = $request->request->get("options");
        $current_user_id = $current_user->getId();

        $acces = $this->get('app.accessmanager')->has_access($current_user_id, $data, $options);
        $data = Array("data" => $acces);

        return new Response($data);
    }

    public function user_has_workspace_access(Request $request)
    {
        $workspace_id = $request->request->get("workspace_id");
        $current_user = $this->getUser();
        $current_user_id = $current_user->getId();

        $publicaccess = $this->get('app.accessmanager')->user_has_workspace_access($current_user_id, $workspace_id);
        $data = Array("data" => $publicaccess);

        return new Response($data);
    }
}
