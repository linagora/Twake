<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 25/06/18
 * Time: 09:24
 */

class CalendarActivityController extends Controller
{

    public function createAction(Request $request){
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $workspace_id = $this->getDoctrine()->getManager()->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id_tmp);
        $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->find($application_tmp);

        $data['data'] = $this->get("app.calendarActivity")->createCalendarActivity($application, $workspace_id,$this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function deleteAction(Request $request){

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $workspace_id = $this->getDoctrine()->getManager()->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id_tmp);
        $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->find($application_tmp);

        $user = $this->getUser();
        $delete = $this->get('app.calendarActivity')->removeAll($application,$workspace_id,$user, null, true);

    }

    public function readAllAction(Request $request){

        $application_tmp = $request->request->get("application");
        $workspace_id_tmp = $request->request->get("workspace_id");

        $workspace_id = $this->getDoctrine()->getManager()->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace_id_tmp);
        $application = $this->getDoctrine()->getManager()->getRepository("TwakeMarketBundle:Application")->find($application_tmp);

        $user = $this->getUser();
        $read = $this->get('app.calendarActivity')->readAll($application,$workspace_id,$user);
    }
    public function getAction(Request $request){


        $user = $this->getUser();
        $delete = $this->get('app.calendarActivity')->getAll($user);
    }
}