<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 09/01/18
 * Time: 10:23
 */

namespace Administration\AuthenticationBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class TwakeGroupManagerController extends Controller
{
    public function listTwakeGroupsAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user != null)
        {
            $pageNumber = $request->request->get("page","1");
            $nbGroupByPage = $request->request->get("per_page","25");
            $filters = $request->request->get("filters","");
            $total = 0;
            $listTwakeGroups = $this->get('admin.TwakeGroupManagement')->listGroup($pageNumber,$nbGroupByPage,$filters,$total);

            $listResponse = Array();

            foreach($listTwakeGroups as $twakeGroup)
            {
                $listResponse[] = $twakeGroup->getAsArray();
            }
            $data["data"]["total"] = $total;
            $data["data"]["users"] = $listResponse;
        }
        else
        {
            $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getInfoWorkspace(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );


    }
}