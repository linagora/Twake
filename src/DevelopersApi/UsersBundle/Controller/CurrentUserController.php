<?php

namespace DevelopersApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\MarketBundle\Entity\DataToken;

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

        $manager = $this->get("app.cassandra_doctrine")->getManager();

        /** @var DataToken $t */
        $t = $this->get("website_api_market.data_token")->getDataToken($requestData["token"]);
	    if ($t == null) {
		    $data["errors"][] = 2101;
        }
        else{
            $user = $manager->getRepository("TwakeUsersBundle:User")->find($t["userId"]);
            $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->find($t["workspaceId"]);

            if ($user && $workspace) {

                $data["data"]["userId"] = $user->getId();
                $data["data"]["groupId"] = ($workspace->getGroup() == null ? null : $workspace->getGroup()->getId());
                $data["data"]["workspaceId"] = $workspace->getId();
                $data["data"]["username"] = $user->getUsername();
                $data["data"]["language"] = $user->getLanguage();
                $data["data"]["userImage"] = "";
                $pimage = $user->getThumbnail();
                if ($pimage) {
                    $data["data"]["userImage"] = $this->getParameter('SERVER_NAME') . $pimage->getPublicURL(2);
                }

            }
        }

        return new JsonResponse($data);
    }

}
