<?php

namespace WebsiteApi\NotificationsBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;

class DefaultController extends Controller
{
    public function initAction()
    {

    	$notifs = $this->get("app.notifications")->getAll($this->getUser());
    	$data = Array();
    	foreach ($notifs as $notif){
    		$data[] = $notif->getAsArray();
	    }
        return new JsonResponse(Array("data"=>$data));
    }
}
