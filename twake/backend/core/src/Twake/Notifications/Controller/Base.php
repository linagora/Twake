<?php

namespace Twake\Notifications\Controller;

use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Base extends BaseController
{

    public function getAction()
    {

        $messages = $this->get("app.twake_doctrine")->getRepository("Twake\Market:Application")->findOneBy(Array("simple_name" => "messages"));

        $notifs = $this->get("app.notifications")->getAll($this->getUser());
        $data = Array();
        foreach ($notifs as $notif) {
            $obj = $notif->getAsArray();
            $data[] = $obj;
        }
        return new Response(Array("data" => $data));

    }

    public function remove(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $application_id = isset($application_tmp["id"]) ? $application_tmp["id"] : $application_tmp;

        $workspace_id = $this->get("app.twake_doctrine")->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $workspace_id_tmp));
        $application = $this->get("app.twake_doctrine")->getRepository("Twake\Market:Application")->findOneBy(Array("id" => $application_id));

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->deleteAll($application, $workspace_id, $user, null, false);
        if (!$delete) {
            $data["errors"][] = "no removal made";
        } else {
            $data["data"][] = "success";
        }

        return new Response($data);
    }

    public function deleteAllExceptMessages(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->deleteAllExceptMessages($user);

        if (!$delete) {
            $data["errors"][] = "no removal made";
        } else {
            $data["data"][] = "success";
        }

        return new Response($data);
    }

    public function readAllExceptMessages(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->readAllExceptMessages($user);

        if (!$delete) {
            $data["errors"][] = "no read made";
        } else {
            $data["data"][] = "success";
        }

        return new Response($data);
    }


    public function readAll(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->readAll($user);
        if (!$delete) {
            $data["errors"][] = "no read made";
        } else {
            $data["data"][] = "success";
        }

        return new Response($data);
    }

}
