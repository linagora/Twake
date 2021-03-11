<?php
/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace Twake\Workspaces\Controller;

use PHPUnit\Util\Json;
use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;


class WorkspaceMembers extends BaseController
{
    
    public function getMembers(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array(
            "nextPageToken" => null,
            "list" => [],
        ));

        $workspaceId = $request->request->get("workspaceId");
        $order = $request->request->get("order", null);
        $max = $request->request->get("max", null);
        $offset = $request->request->get("offset", null);
        $query = $request->request->get("query", null);

        if($query){
            $all_info = $this->get("app.workspace_members")->searchMembers($workspaceId, $this->getUser()->getId(), $query);
        }else{
            $all_info = $this->get("app.workspace_members")->getMembers($workspaceId, $this->getUser()->getId(), $order, $max, $offset);
        }
        $response["data"] = [];

        foreach($all_info as $user){
            $user["user"] = $user["user"]->getAsArray();
            $response["data"]["list"][$user["user"]["id"]] = $user;
            $response["data"]["nextPageToken"] = $user["user"]["id"];
        }

        return new Response($response);
    }

    public function getPending(Request $request)
    {
        $response = Array("errors" => Array(), "data" => Array(
            "nextPageToken" => null,
            "list" => [],
        ));

        $workspaceId = $request->request->get("workspaceId");
        $order = $request->request->get("order", null);
        $max = $request->request->get("max", null);
        $offset = $request->request->get("offset", null);

        $all_info = $this->get("app.workspace_members")->getPendingMembers($workspaceId, $this->getUser()->getId(), $max, $offset);
        $response["data"] = [];

        foreach($all_info as $mail){
            $object = Array(
                "mail" => $mail->getMail(),
                "id" => $mail->getId(),
                "externe" => $mail->getExterne()
            );
            $response["data"]["list"][$mail->getMail()] = $object;
            $response["data"]["nextPageToken"] = $mail->getMail();
        }

        return new Response($response);
    }

    /**
     * Add list of usernames or mails
     */
    public function addList(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $list = $request->request->get("list", "");

        $list = str_replace(Array(",", ";"), " ", $list);
        $list = preg_replace('!\s+!', ' ', $list);
        $list = explode(" ", $list);

        $added = Array("user" => Array(), "pending" => Array());
        $not_added = Array();
        foreach ($list as $element) {
            $element = trim($element);
            $element = explode("|", $element);
            if (!isset($element[1])) {
                $element[1] = "0";
            }
            $asExterne = $element[1] == "1" ? true : false;
            $element = $element[0];
            if (strlen($element) > 0) {
                if (strrpos($element, "@") <= 0) { //No mail or "@username"
                    $res = $this->get("app.workspace_members")->addMemberByUsername($workspaceId, $element, $asExterne, $this->getUser()->getId());
                    if ($res) {
                        $added["user"][] = $element;
                    } else {
                        $not_added[] = $element;
                    }
                } else {
                    $res = $this->get("app.workspace_members")->addMemberByMail($workspaceId, $element, $asExterne, $this->getUser()->getId());
                    if ($res == "user") {
                        $added["user"][] = $element;
                    } elseif ($res == "mail") {
                        $added["pending"][] = $element;
                    } else {
                        $not_added[] = $element;
                    }
                }
            }
        }

        $response["data"]["added"] = $added;
        $response["data"]["not_added"] = $not_added;

        return new Response($response);
    }

    /**
     * Remove e-mail wainting for add
     */
    public function removeMail(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $mail = $request->request->get("mail", "");

        $res = $this->get("app.workspace_members")
            ->removeMemberByMail($workspaceId, $mail, $this->getUser()->getId());

        $response["data"] = $res;

        return new Response($response);
    }

    /**
     * Remove list of members by ids
     */
    public function removeMembers(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $ids = $request->request->get("ids", Array());

        $removed = 0;
        foreach ($ids as $id) {
            $res = $this->get("app.workspace_members")
                ->removeMember($workspaceId, $id, $this->getUser()->getId());
            if ($res) {
                $removed++;
            }
        }

        $response["data"]["removed"] = $removed;

        return new Response($response);
    }

    /**
     * Change level of members
     */
    public function changeMembersLevel(Request $request)
    {

        $response = Array("errors" => Array(), "data" => Array());

        $workspaceId = $request->request->get("workspaceId");
        $ids = $request->request->get("usersId", Array());
        $levelId = $request->request->get("levelId");

        $updated = 0;
        foreach ($ids as $id) {
            $res = $this->get("app.workspace_members")
                ->changeLevel($workspaceId, $id, $levelId, $this->getUser()->getId());
            if ($res) {
                $updated++;
            }
        }

        $response["data"]["updated"] = $updated;

        return new Response($response);
    }


    public function getWorkspaces(Request $request)
    {
        $response = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $workspaces = $this->get("app.workspace_members")->getWorkspaces($this->getUser()->getId());

        foreach ($workspaces as $workspace) {
            $response["data"][] = Array(
                "workspace" => $workspace["workspace"]->getAsArray(),
                "last_access" => $workspace["last_access"],
                "ishidden" => $workspace["ishidden"],
                "isfavorite" => $workspace["isfavorite"],
                "hasnotifications" => $workspace["hasnotifications"],
                "isArchived" => $workspace["isArchived"]);
        }

        if (count($workspaces) == 0) {
            $response["errors"][] = "empty list";
        }


        return new Response($response);
    }

}
