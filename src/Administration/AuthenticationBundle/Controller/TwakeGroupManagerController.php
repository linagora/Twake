<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 09/01/18
 * Time: 10:23
 */

namespace Administration\AuthenticationBundle\Controller;

use phpDocumentor\Reflection\Types\Array_;
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

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        //if($user != null)
        {
            $pageNumber = $request->request->get("page","1");
            $nbGroupByPage = $request->request->get("per_page");
            $filters = $request->request->get("filters");
            $total = 0;
            $listTwakeGroups = $this->get('admin.TwakeGroupManagement')->listGroup($pageNumber,$nbGroupByPage,$filters,$total);
            if($listTwakeGroups !=  null) {
                $listResponse = Array();

                foreach ($listTwakeGroups as $twakeGroup) {
                    $listResponse[] = $twakeGroup->getAsSimpleArray();
                }
                $data["data"]["total"] = $total;
                $data["data"]["workspaces"] = $listResponse;
            }
         //   else
            {
          //      $data["errors"][] = "not found";
            }
        }
        //else
        {
        //    $data["errors"][] = "disconnected";
        }
        return new JsonResponse($data);
    }

    public function getInfoWorkspaceAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $idTwakeWorkspace = $request->request->get("id","");
            $workspace = $this->get('admin.TwakeGroupManagement')->getInfoWorkspace($idTwakeWorkspace);
            if($workspace != null)
            {
                $data["data"]["workspace"] = $workspace->getAsSimpleArray();
            }
            //else
            {
                $data["errors"][] = "not found";
            }
        }
        //else
        {
            $data["errors"][] = "disconnected";
        }

        return new JsonResponse($data);
    }

    public function searchWorkspaceAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        //if($user != null)
        {
            $name = $request->request->get("name","");
            $memberCount = $request->request->get("nombre_membre","");
            $pageNumber = $request->request->get("page","1");
            $nbWorkspaceByPage = $request->request->get("per_page","25");
            $totalNumber = 0;
            $listWorkspace = $this->get('admin.TwakeGroupManagement')->searchWorkspace($pageNumber,$nbWorkspaceByPage,$name,$memberCount,$totalNumber);


            if($listWorkspace != null ) {
                $listResponse = Array();

                foreach ($listWorkspace as $twakeGroup) {
                    $listResponse[] = $twakeGroup->getAsSimpleArray();
                }
                $data["data"]["total"] = $totalNumber;
                $data["data"]["workspaces"] = $listResponse;
            }
            //else
            {
                $data["errors"][] = "disconnected";
            }

        }
        //else
        {
            $data["errors"][] = "disconnected";
        }

        return new JsonResponse($data);
    }

    public function sizeWorkspaceAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user != null)
        {

            $idTwakeWorkspace = $request->request->get("id","");
            $workspace =  $this->get('admin.TwakeGroupManagement')->sizeWorkspace($idTwakeWorkspace);
            if($workspace != null)
            {
                $data["data"][] = $workspace;
            }
            else
            {
                $data["errors"][] = "not found";
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }

        return new JsonResponse($data);
    }
}