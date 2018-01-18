<?php
/**
 * Created by PhpStorm.
 * User: neoreplay
 * Date: 16/01/18
 * Time: 14:42
 */

namespace Administration\AuthenticationBundle\Controller;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;
use Symfony\Component\Serializer\Encoder\JsonEncode;

class StatisticsController extends Controller
{

    public function numberOfUserCurrentlyConnectedAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $nbConnected = $this->get('admin.TwakeStatistics')->numberOfUserCurrentlyConnected();
            if($nbConnected != null)
            {
                $data["data"][] = $nbConnected;
            }
        }
        //else
        {
            $data["errors"][] = "disconnected";
        }


        return new JsonResponse($data);
    }

    public function numberOfUsersAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $nbUser = $this->get('admin.TwakeStatistics')->numberOfUsers();
            if($nbUser != null)
            {
                $data["data"][] = $nbUser;
            }
        }
        else
        {
            $data["errors"][] = "disconnected";
        }


        return new JsonResponse($data);
    }

    public function numberOfAppUserAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $idApp = $request->request->get("idapp","");
            $nbAppUser = $this->get('admin.TwakeStatistics')->numberOfAppUser($idApp);
            if($nbAppUser != null)
            {
                $data["data"][] = $nbAppUser;
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

    public function numberOfWorkspaceByAppAction(Request $request)
    {
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user != null)
        {
            $idApp = $request->request->get("idapp","");
            $nbWorkByApp = $this->get('admin.TwakeStatistics')->numberOfWorkspaceByApp($idApp);
            if($nbWorkByApp != null)
            {
                $data["data"][] = $nbWorkByApp;
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

    public function numberOfExtensionsAction(Request $request){
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );

        //$user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        //if($user != null)
        {
            $nbOfExtenstion= $this->get('admin.TwakeStatistics')->numberOfExtensions();
            if($nbOfExtenstion != null)
            {
                $data["data"][] = $nbOfExtenstion;
            }
            else
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

}