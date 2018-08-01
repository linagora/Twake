<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 31/07/18
 * Time: 14:45
 */

namespace WebsiteApi\WorkspacesBundle\Services;


use WebsiteApi\MarketBundle\Services\MarketApplication;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceActivity;

class WorkspacesActivities
{
    private $doctrine;
    /* @var MarketApplication $applicationManager */
    var $applicationManager;

    public function __construct($doctrine, $applicationManager)
    {
        $this->doctrine = $doctrine;
        $this->applicationManager = $applicationManager;
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function recordActivity($workspace, $user, $appPublicKey,$title,$objectRepository,$objectId){
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");
        $user = $this->convertToEntity($user,"TwakeUsersBundle:User");
        $app = $this->applicationManager->getAppByPublicKey($appPublicKey);

        $workspaceActivity = new WorkspaceActivity($workspace,$user,$app,$title,$objectRepository,$objectId);

        $this->doctrine->persist($workspaceActivity);
        $this->doctrine->flush();
    }

    public function getRecordByWorkspace($workspace){
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");
        return $this->doctrineè>getRepository("TwakeWorkspacesBundle:WorkspaceActivity")->findBy(Array("workspace"=>$workspace));
    }
}