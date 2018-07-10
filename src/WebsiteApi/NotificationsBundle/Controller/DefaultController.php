<?php

namespace WebsiteApi\NotificationsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DefaultController extends Controller
{
    public function initAction()
    {

        $messages = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "messages"));

        $notifs = $this->get("app.notifications")->getAll($this->getUser());
    	$data = Array();
    	foreach ($notifs as $notif){
            $obj = $notif->getAsArray();
            if ($obj["app_id"] == $messages->getId()) {
                $obj["isMessage"] = true;
            }
            $data[] = $obj;
	    }
        return new JsonResponse(Array("data"=>$data));

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

    public function deleteAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $workspace_id = $this->getDoctrine()->getManager()->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$workspace_id_tmp));
        $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("id"=>$application_tmp["id"]));

        $user = $this->getUser();
        $delete = $this->get('app.notifications')->readAll($application, $workspace_id, $user, null, false);
        if (!$delete){
            $data["errors"][] = "no removal made";
        } else{
            $data["data"][] = "success";
        }

        return new JsonResponse($data);
    }
}
