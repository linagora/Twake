<?php

namespace WebsiteApi\DriveBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Intl\Tests\Data\Provider\Json\JsonScriptDataProviderTest;

class DriveActivityController extends Controller
{

    public function createAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $workspace_id = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id_tmp);
        $application = $this->get("app.twake_doctrine")->getRepository("TwakeMarketBundle:Application")->find($application_tmp);

        $data['data'] = $this->get("app.driveActivity")->createDriveActivity($application, $workspace_id, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function deleteAction(Request $request)
    {

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $workspace_id = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id_tmp);
        $application = $this->get("app.twake_doctrine")->getRepository("TwakeMarketBundle:Application")->find($application_tmp);

        $user = $this->getUser();
        $delete = $this->get('app.driveActivity')->removeAll($application, $workspace_id, $user, null, true);
        return new JsonResponse();

    }

    public function readAllAction(Request $request)
    {

        $workspace_id_tmp = $request->request->get("workspaceId");

        $workspace_id = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id_tmp);

        $user = $this->getUser();
        $read = $this->get('app.driveActivity')->readAll($workspace_id, $user);
        return new JsonResponse();
    }

    public function readOneAction(Request $request){

        $activity_id = $request->request->get("activityId");
        $workspace_id= $request->request->get("workspaceId");

        $workspaceId = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id);
        $read = $this->get('app.driveActivity')->readOne($workspaceId,$activity_id);
        return new JsonResponse();
    }

    public function getActivityToDisplayAction(Request $request){


        $user = $this->getUser();
        $workspace = $request->request->get("workspaceId");
        $offset = $request->request->get("offset");
        $limit = $request->request->get("limit");

        $data = Array(
            'errors' => Array(),
            'data' => $this->get('app.driveActivity')->getActivityToDisplay($user, $workspace,$offset,$limit)
        );
        return new JsonResponse($data);

    }
}