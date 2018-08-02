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
    /* @var WorkspaceMembers $workspaceMembers*/
    var $workspaceMembers;

    public function __construct($doctrine, $applicationManager, $workspaceMembers)
    {
        $this->doctrine = $doctrine;
        $this->applicationManager = $applicationManager;
        $this->workspaceMembers = $workspaceMembers;
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
        return $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceActivity")->findBy(Array("workspace"=>$workspace));
    }

    public function getWorkspaceActivityResumed($workspace){
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");
        $users = $this->workspaceMembers->getMembers($workspace);
        $resumed = Array();

        foreach ($users as $user){
            $userActivity = Array("user" => $user, "app" => []);
            $activities = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceActivity")->findBy(Array("workspace"=>$workspace, "user" => $user));

            foreach ($activities as $activity){
                /* @var WorkspaceActivity $activity*/
                if(!isset($userActivity[$activity->getApp()->getId()])){
                    $userActivity["app"][$activity->getApp()->getId()] = Array();
                }
                if(!isset($userActivity[$activity->getApp()->getId()][$activity->getTitle()])){
                    $userActivity["app"][$activity->getApp()->getId()][$activity->getTitle()] = Array();

                }
                $userActivity["app"][$activity->getApp()->getId()][$activity->getTitle()][] = $activity->getObjectId();
            }

            $resumed[] = $userActivity;
        }

        return $resumed;
    }
}