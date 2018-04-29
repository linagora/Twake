<?php

namespace DevelopersApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\Application;

class CurrentUserController extends Controller
{

    public function verifyTokenUserAction(Request $request){

	    $request = $this->get("api.CheckRightApplication")->getRequestData($request);
	    if (isset($request["errors"])) {
		    return new JsonResponse($request["errors"]);
	    }

	    $requestData = $request["data"];

	    $data = Array(
		    "data" => Array(),
		    "errors" => Array()
	    );

        $manager = $this->getDoctrine()->getManager();

	    $t = $manager->getRepository("DevelopersApiUsersBundle:Token")
		    ->findOneBy(Array("token" => $requestData["token"]));
	    if ($t == null) {
		    $data["errors"][] = 2101;
        }
        else{
	        $data["data"]["userId"] = $t->getUser()->getId();
            $data["data"]["groupId"] = ($t->getWorkspace()->getGroup() == null ? null : $t->getWorkspace()->getGroup()->getId());
            $data["data"]["workspaceId"] = $t->getWorkspace()->getId();
	        $data["data"]["username"] = $t->getUser()->getUsername();
	        $data["data"]["language"] = $t->getUser()->getLanguage();
	        $data["data"]["userImage"] = "";
	        $pimage = $t->getUser()->getThumbnail();
	        if ($pimage) {
		        $data["data"]["userImage"] = $this->getParameter('SERVER_NAME') . $pimage->getPublicURL(2);
	        }
	        $manager->remove($t);
	        $manager->flush();
        }

        return new JsonResponse($data);
    }

}
