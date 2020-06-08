<?php

namespace BuiltInConnectors\Connectors\Jitsi\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Index extends BaseController
{

    public function event(Request $request)
    {
        $data = $request->request->get("data");
        $event = $request->request->get("event");
        $type = $request->request->get("type");

        $this->get('connectors.jitsi.event')->proceedEvent($type, $event, $data);

        return new Response([]);
    }

    public function call(Request $request){
        $user_id = $request->query->get("twake_user", false);
        $group_id = $request->query->get("twake_group", false);
        $user = $this->get('connectors.jitsi.event')->getUserFromId(str_replace("twake-", "", $id), $user_id, $group_id);
        return $this->render("@Jitsi/Default/call.html.twig",Array("id"=>$id, "user"=>$user));
    }

}
