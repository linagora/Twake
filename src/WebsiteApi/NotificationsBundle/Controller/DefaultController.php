<?php

namespace WebsiteApi\NotificationsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends Controller
{

    public function getAction()
    {

        $messages = $this->get("app.twake_doctrine")->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("simple_name" => "messages"));

        $notifs = $this->get("app.notifications")->getAll($this->getUser());
        $data = Array();
        foreach ($notifs as $notif) {
            $obj = $notif->getAsArray();
            $data[] = $obj;
        }
        return new JsonResponse(Array("data"=>$data));

    }

    public function removeAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $application_id = isset($application_tmp["id"]) ? $application_tmp["id"] : $application_tmp;

        $workspace_id = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace_id_tmp));
        $application = $this->get("app.twake_doctrine")->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("id" => $application_id));

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->deleteAll($application, $workspace_id, $user, null, false);
        if (!$delete) {
            $data["errors"][] = "no removal made";
        } else {
            $data["data"][] = "success";
        }

        return new JsonResponse($data);
    }

    public function deleteAllExceptMessagesAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->deleteAllExceptMessages($user);

        if (!$delete){
            $data["errors"][] = "no removal made";
        } else{
            $data["data"][] = "success";
        }

        return new JsonResponse($data);
    }

    public function readAllExceptMessagesAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->readAllExceptMessages($user);

        if (!$delete){
            $data["errors"][] = "no read made";
        } else{
            $data["data"][] = "success";
        }

        return new JsonResponse($data);
    }


    public function readAllAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->readAll($user);
        if (!$delete){
            $data["errors"][] = "no read made";
        } else{
            $data["data"][] = "success";
        }

        return new JsonResponse($data);
    }

}
