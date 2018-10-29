<?php
/**
 * Created by PhpStorm.
 * User: Elliot
 * Date: 23/04/2018
 * Time: 10:57
 */

namespace WebsiteApi\WorkspacesBundle\Controller;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class GroupManagerController extends Controller
{
    /**
     * Récupère les managers d'un group
     */
    public function getManagersAction(Request $request){

        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");

        $managers = $this->get("app.group_managers")->getManagers($groupId, $this->getUser()->getId());

        if(!is_array($managers)){
            $response["errors"][] = "notallowed";
        }else {
            $list = Array();
            foreach ($managers as $manager) {
                $list[] = Array(
                    "user" => $manager["user"]->getAsArray(),
                    "level" => $manager["level"],
                );
            }

            $response["data"] = Array(
                "managers" => $list
            );
        }

        return new JsonResponse($response);
    }

    /**
     * Ajoute un manager au groupe
     */
    public function addManagersAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $username = $request->request->get("username");

        $username = str_replace(Array("@", " "), "", $username);

        $userRepository = $this->get("app.doctrine_adapter")->getRepository("TwakeUsersBundle:User");
        $user = $userRepository->findOneBy(Array("username"=>$username));

        if(!$user){
            $response["errors"][] = "usernotfound";
            return new JsonResponse($response);
        }

        $result = $this->get("app.group_managers")->addManager($groupId, $user->getId(), 1, false, $this->getUser()->getId());


        if(!$result){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"] = "success";
        }

        return new JsonResponse($response);
    }

    /**
     * Retire un managers d'un group
     */
    public function removeManagersAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $userId = $request->request->get("userId");

        $result = $this->get("app.group_managers")->removeManager($groupId, $userId, $this->getUser()->getId());

        if(!$result){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"] = "success";
        }

        return new JsonResponse($response);
    }

    /**
     * edite le managers d'un group
     */
    public function editManagersAction(Request $request){
        $response = Array("errors"=>Array(), "data"=>Array());

        $groupId = $request->request->getInt("groupId");
        $userId = $request->request->get("userId");
        $level = $request->request->get("level");

        $result = $this->get("app.group_managers")->changeLevel($groupId,$userId,$level,$this->getUser()->getId());

        if(!$result){
            $response["errors"][] = "notallowed";
        }else {
            $response["data"] = "success";
        }

        return new JsonResponse($response);
    }

}
