<?php

namespace DevelopersApiV1\CoreBundle\Services;


use phpDocumentor\Reflection\Types\Array_;
use Symfony\Component\HttpFoundation\Request;

class CheckService
{
    /**
     * CheckService constructor.
     */
    public function __construct($doctrine, $accessLogService)
    {
        $this->doctrine = $doctrine;
        $this->accessLogService = $accessLogService;

    }

    public function check(Request $request){

        $application = false;
        $header = $request->headers->get("Authorization");
        $explode1 = explode(" ",$header);

        if (count($explode1) == 2 && $explode1[0] == "Basic"){

            $exploser2 = explode(":",base64_decode($explode1[1]));

            if (count($exploser2) == 2){
                $publicKey = $exploser2[0];
                $privateKey = $exploser2[1];

                $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey"=> $publicKey));

                if ($application != null){
                    $key = $application->getPrivateKey();

                    if ($key == $privateKey) {
                        return $application;
                    }
                }
            }
        }
        return false;
    }

    public function get(Request $request){
        $request = @json_decode($request->getContent(), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $request = Array();
        }
        return $request;
    }


    public function isAllowedTo($application, $action, $workspaceId){

        $rights = $application->getApplicationRights();

        //Compare with action asked
        $actions = explode(":", $action);
        $object = $actions[0];
        $value = intval(str_replace(Array("none", "read", "write", "manage"),Array(0,1,2,3),$actions[1]));

        $this->accessLogService->record($application->getId(), $value);

        if(!isset($rights[$object]) || intval(str_replace(Array("none", "read", "write", "manage"),Array(0,1,2,3),$rights[$object])) < $value){
            return false;
        }

        return $this->containsApp($workspaceId,$application);
    }


    public function containsApp($workspaceId, $application){
        $workspaceRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace");
        $workspace = $workspaceRepository->find($workspaceId);

        if($workspace==null){
            return false;
        }

        if($workspace->getUser()!=null)//If is private
            return $application->getDefault();

        //Group apps
        $workspaceappsRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceApp");
        $workspaceapp = $workspaceappsRepository->findOneBy(Array("workspace" => $workspace, "groupapp" => $application->getId()));

        return $workspaceapp!=null;
    }

}
