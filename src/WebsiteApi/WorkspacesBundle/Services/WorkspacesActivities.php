<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 31/07/18
 * Time: 14:45
 */

namespace WebsiteApi\WorkspacesBundle\Services;


use Doctrine\ORM\ORMException;
use Dompdf\Exception;
use WebsiteApi\MarketBundle\Services\MarketApplication;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceActivity;

class WorkspacesActivities
{
    /* @var MarketApplication $applicationManager */
    var $applicationManager;
    private $doctrine;

    public function __construct($doctrine, $applicationManager)
    {
        $this->doctrine = $doctrine;
        $this->applicationManager = $applicationManager;
    }

    public static function cmpResumed($a, $b)
    {
        return $b["date"] - $a["date"];
    }

    public function recordActivity($workspace, $user, $appPublicKey, $title, $objectrepository = null, $objectid = null)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        $user = $this->convertToEntity($user, "TwakeUsersBundle:User");
        $app = $this->applicationManager->getAppByPublicKey($appPublicKey);

        $workspaceActivity = new WorkspaceActivity($workspace, $user, $app, $title, $objectrepository, $objectid);

        $this->doctrine->persist($workspaceActivity);
        $this->doctrine->flush();
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var) || get_class($var) == "Ramsey\Uuid\Uuid") {
            try {
                $r = $this->doctrine->getRepository($repository)->find($var);
            } catch (ORMException $e) {
                $r = null;
            }
        } else if (is_object($var)) {
            $r = $var;
        } else {
            $r = null;
        }
        return $r;

    }

    public function getRecordByWorkspace($workspace)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        return $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceActivity")->findBy(Array("workspace" => $workspace));
    }

    public function getWorkspaceActivityResumed($workspace, $userIdsList, $limit = 100, $offset = 0)
    {
        $workspace = $this->convertToEntity($workspace, "TwakeWorkspacesBundle:Workspace");
        $users = [];

        foreach ($userIdsList as $user) {
            $users[] = $this->convertToEntity($user["user"], "TwakeUsersBundle:User");
        }

        /* @var WorkspaceActivity[] $activities */
        $activities = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceActivity")->findBy(Array("workspace" => $workspace), Array("id" => "desc"), $limit, $offset);

        // Get activity by unique user/app id
        $activities_by_user_app = Array();
        $last_date_by_user_app = Array();
        foreach ($activities as $activity) {

            $key = ($activity->getApp() ? $activity->getApp()->getId() : "") . "_" . ($activity->getUser() ? $activity->getUser()->getId() : "");

            if (!isset($activities_by_user_app[$key])) {
                $activities_by_user_app[$key] = Array();
            }
            $addToPrevious = false;
            if (isset($last_date_by_user_app[$key]) && abs($activity->getDateAdded()->getTimestamp() - $last_date_by_user_app[$key]) < 60) {
                $addToPrevious = true;
            }
            if ($addToPrevious) {
                end($activities_by_user_app[$key]);
                $end_pos = key($activities_by_user_app[$key]);
                if ($activity->getObjectRepository()) {
                    try {
                        $obj = $this->convertToEntity($activity->getObjectId(), $activity->getObjectRepository());
                        if ($obj && isset($activities_by_user_app[$key][$end_pos]["objects"])) {
                            $found = false;
                            foreach ($activities_by_user_app[$key][$end_pos]["objects"] as $o) {
                                if ($o["id"] == $obj->getId()) {
                                    $found = true;
                                    break;
                                }
                            }
                            if (!$found && method_exists($obj, "getAsArrayFormated")) {
                                $activities_by_user_app[$key][$end_pos]["objects"][] = $obj->getAsArrayFormated();
                            }
                        }
                    } catch (Exception $e) {
                        error_log($e);
                    }
                }
            } else {
                $objects = Array();
                if ($activity->getObjectRepository()) {
                    try {
                        $obj = $this->convertToEntity($activity->getObjectId(), $activity->getObjectRepository());
                        if ($obj && method_exists($obj, "getAsArrayFormated")) {
                            $objects[] = $obj->getAsArrayFormated();
                        }
                    } catch (Exception $e) {
                        error_log($e);
                    }
                }
                if (count($objects) > 0) {
                    $activities_by_user_app[$key][] = Array(
                        "user" => ($activity->getUser() ? $activity->getUser()->getAsArray() : null),
                        "app" => ($activity->getApp() ? $activity->getApp()->getAsSimpleArray() : null),
                        "date" => $activity->getDateAdded()->getTimestamp(),
                        "title" => $activity->getTitle(),
                        "objects" => $objects
                    );
                }
            }

            $last_date_by_user_app[$key] = $activity->getDateAdded()->getTimestamp();

        }


        $resumed = Array();
        foreach ($activities_by_user_app as $grouped_activity) {
            $resumed = array_merge($resumed, $grouped_activity);
        }

        usort($resumed, "self::cmpResumed");

        return $resumed;
    }
}
