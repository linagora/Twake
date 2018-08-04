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

        $activities = $this->get("app.workspaces_activities")->getWorkspaceActivityResumed($workspace, $users);

        $translator = $this->get("app.translate");
        foreach($activities as $key=>$activity) {
            $activities[$key]["title"] = $translator->translate(
                new TranslationObject($translator,
                    $activities[$key]["title"],
                    $activities[$key]["user"]?("@".$activities[$key]["user"]["username"]):"@twake_bot",
                    count($activities[$key]["objects"])),
                $this->getUser()->getLanguage()
            );
        }

        $response["data"] = $activities;

        return new JsonResponse($response);
    }

}
