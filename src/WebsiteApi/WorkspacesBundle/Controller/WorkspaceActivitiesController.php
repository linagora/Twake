<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace WebsiteApi\WorkspacesBundle\Controller;

use PHPUnit\Util\Json;
use WebsiteApi\CoreBundle\Services\Translate;
use WebsiteApi\CoreBundle\Services\TranslationObject;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class WorkspaceActivitiesController extends Controller
{
    public function getActivitiesAction(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspace = $request->request->get("id",0);
        $users = $this->get("app.workspace_members")->getMembers($workspace);

        $activities = $this->get("app.workspaces_activities")->getWorkspaceActivityResumed($workspace,$users);

        foreach ($activities as $akey => $activity){
            $activities[$akey]["user"] = $activity["user"]->getAsArray();

            foreach ($activity["app"] as $date => $dateData) {
                foreach ($dateData as $appId => $appData) {
                    foreach ($appData as $action => $objects) {
                        foreach ($objects as $key => $object)
                        {
                            $activities[$akey]["app"][$date][$appId][$action][$key] = $object->getAsArray();
                        }
                    }
                }
            }
        }

        $response["data"] = $activities;

        return new JsonResponse($response);
    }
    public function getActivitiesPreviewAction(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspace = $request->request->get("id",0);
        $users = $this->get("app.workspace_members")->getMembers($workspace);

        $activities = $this->get("app.workspaces_activities")->getWorkspaceActivityResumed($workspace,$users);
        /* @var Translate $translator*/
        $translator = $this->get("app.translate");

        $res = [];

        foreach ($activities as $activity){
            $username =  $activity["user"]->getUsername();

            foreach ($activity["app"] as $date => $dateData) {
                foreach ($dateData as $appId => $appData) {
                    foreach ($appData as $action => $objects) {
                        $res[] = Array("text" => $translator->translate(new TranslationObject($translator, $action, $username, count($objects)), $this->getUser()->getLanguage()), "date" => $date);
                    }
                }
            }
        }

        $response["data"] = $res;

        return new JsonResponse($response);
    }

}
