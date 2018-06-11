<?php

namespace WebsiteApi\NotificationsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

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
}
