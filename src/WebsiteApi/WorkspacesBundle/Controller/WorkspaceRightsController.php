<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 17/01/2017
 * Time: 14:34
 */

namespace WebsiteApi\WorkspacesBundle\Controller;


use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\Level;
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use WebsiteApi\WorkspacesBundle\Repository\LinkWorkspaceUserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class WorkspaceRightsController extends Controller
{

    public function hasAccesAction(Request $request){
        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"), "isDeleted"=>false));
        if ($workspace == null) {
            $data['errors'][] = "groupnotfound";
        }
        else {
            if($this->get('app.levelManager')->hasRight($this->getUser(), $workspace, 'base')){
                $data["acces"]= true;
            }
            else{
                $data["acces"]= true;
            }
        }
        return new JsonResponse($data);
    }


	public function getLevelsAction(Request $request) {

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}
		else {

			$user = $this->getUser();
			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

			if ($workspace == null) {
				$data['errors'][] = "groupnotfound";
			}
			else {

				if (!$this->get('app.workspace_levels')->hasRight($user, $workspace, 'base:right:viewOther')) {
					$data['errors'][] = "accessdenied";
				}
				else {
					$repositoryLevel = $manager->getRepository("TwakeWorkspacesBundle:Level");

					$repositoryLink = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser");
					$nb = $manager->createQueryBuilder()
						->select("IDENTITY(l.level), count(l.User)")
						->from("TwakeWorkspacesBundle:LinkWorkspaceUser", "l")
						->where("l.Workspace=:workspace")
						->setParameter("workspace", $workspace)
						->groupby("l.level")
						->getQuery()
			            ->getResult();

					$levels = $repositoryLevel->findBy(Array(
		                                        "groupe" => $workspace
                            				));
						foreach($levels as $level){
							if($level->getOwner()){
								$right = $this->get('app.workspace_levels')->getRightsPossible($workspace);
							}
							else{
								$right = $level->getRight();
							}


							$memberCount = $manager->createQueryBuilder()
								->select('COUNT(l)')
								->from("TwakeWorkspacesBundle:LinkWorkspaceUser", "l")
								->where("l.status = 'A'")
								->andWhere("l.level = :level")
								->setParameter("level", $level)
								->getQuery()
								->getSingleScalarResult();

							$data["data"][] =  Array(
								"idLevel" => $level->getId(),
								"nameLevel" => $level->getName(),
								"right" => $right,
								"owner" => $level->getOwner(),
								"isDefault" => $level->getDefault(),
								"count"=>$nb,
								"memberCount" => $memberCount
							);
						}
				}
			}
		}
		return new JsonResponse($data);
	}

	public function deplaceLevelMembersAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$levelFrom = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneById($request->request->getInt("levelIdFrom"));
		$levelTo = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneById($request->request->getInt("levelIdTo"));
		$workspace = $levelFrom->getGroup();

		$data = Array(
			"errors" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if($workspace != $levelTo->getGroup()){
			$data['errors'][] = "differentgroup";
		}
		else if($levelFrom->getOwner()){
			$data['errors'][] = "notallowed";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{

			$memberLinkToModify = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("level" => $levelFrom));

			foreach ($memberLinkToModify as $link) {
				$link->setLevel($levelTo);
				$manager->persist($link);
			}
			$manager->flush();
		}
		return new JsonResponse($data);
	}

	public function getAllRightsAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

		$data = Array(
			"errors" => Array(),
			"data" =>Array(),
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($workspace == null){
			$data["errors"][] = "groupnotfound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, 'base:right:viewOther')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$data["data"] = $this->get('app.workspace_levels')->getRightsPossible($workspace);
		}
		return new JsonResponse($data);
	}

	public function createLevelAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$name = $request->request->get("name");


		$data = Array(
			"errors" => Array(),
		);

		if(!preg_match("/[a-z0-9]/i", $name)){
			$data["errors"][] = "empty";
		}else if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($workspace == null){
			$data["errors"][] = "groupnotfound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, 'base:level:create')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$defaultLevel = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneBy(Array("groupe"=>$workspace,"isDefault"=>true));
			$level = new Level;
			$level->setName($name);
			$level->setRight($defaultLevel->getRight());
			$level->setGroup($workspace);
			$level->setOwner(false);
			$level->setDefault(false);
			$manager->persist($level);
			$manager->flush();
		}
		return new JsonResponse($data);
	}



	public function changelevelUsersAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneBy(Array("groupe"=>$group,"id"=>$request->request->get("levelId")));
		$links =  $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy( Array("Workspace" => $group, "User"=>$request->request->get("uids")));
		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($group == null){
			$data["errors"][] = "workspaceNotFound";
		}
		else if( $level == null){
			$data['errors'][] = "levelNotFound";
		}
		else if(count($links)<=0){
			$data["errors"][] = "usersNotFound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $group, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{

			$groupOwnerCount = 0;
			$currentOwnerCount = 0;

			$links2 = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("Workspace" => $group));
			foreach ($links2 as $link) {
				if ($link->getLevel()->getOwner()) {
					++$groupOwnerCount;
				}
			}

			$links2 = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findBy(Array("Workspace" => $group, "User" => $request->request->get("uids")));
			foreach ($links2 as $link) {
				if ($link->getLevel()->getOwner()) {
					++$currentOwnerCount;
				}
			}

			if ($groupOwnerCount == $currentOwnerCount) {
				$data["errors"][] = "lastOwner";
			}
			else {
				foreach($links as $link) {
					$link->setLevel($level);
					$manager->persist($link);
				}
				$this->get('app.updateGroup')->push($request->request->get("groupId"));
			}

			$manager->flush();

		}
		return new JsonResponse($data);
	}

	public function deleteLevelsAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneById($request->request->getInt("levelId"));
		$rights = $request->request->get("rights");

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if( $level == null){
			$data['errors'][] = "levelNotFound";
		}
		else if ($workspace == null){
			$data["errors"][] = "workspaceNotFound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, 'base:level:delete')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$levelIdArray = $request->request->getInt("levelId");
			$levelArray =  $manager->getRepository("TwakeWorkspacesBundle:Level")->findById($levelIdArray);
			foreach($levelArray as $level){
				if($level->getOwner()){
					$data["errors"][] = "levelOwner";
				}
				else if($level->getDefault()){
					$data["errors"][] = "levelDefault";
				}
				else{
					$defaultLevel = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneBy(Array("groupe"=>$workspace, "isDefault"=>true));

					$links = $this->getDoctrine()->getManager()->createQueryBuilder();
					$links->update("TwakeWorkspacesBundle:LinkWorkspaceUser","l");
					$links->set("l.level",":dftLvl");
					$links->where("l.level=:lvl");
					$links->setParameter("lvl",$level);
					$links->setParameter("dftLvl",$defaultLevel);
					$links->getQuery()->execute();
					$manager->remove($level);
				}
			}
			$manager->flush();
      $this->get('app.updateGroup')->push($request->request->get("groupId"));
		}

		//Todo faire passer les personnes des niveaux supprimés au niveau de base
		return new JsonResponse($data);
	}

	public function updateLevelAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneById($request->request->getInt("levelId"));
		$rights = $request->request->get("rights");
		$name = $request->request->get("name");


		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if( $level == null){
			$data['errors'][] = "levelNotFound";
		}
		else if ($workspace == null){
			$data["errors"][] = "workspaceNotFound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$level->setRight($rights);
			if(preg_match("/[a-z0-9]/i", $name)){
				$level->setName($name);
			}
			$manager->persist($level);
			$data['status'][] = "Ok";
      $manager->flush();
      $this->get('app.updateGroup')->push($request->request->get("groupId"));
		}

		return new JsonResponse($data);
	}

	public function setDefaultLevelAction(Request $request) {

		$manager = $this->getDoctrine()->getManager();
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneById($request->request->getInt("levelId"));

		$data = Array(
			"errors" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if( $level == null){
			$data['errors'][] = "levelNotFound";
		}
		else if ($workspace == null){
			$data["errors"][] = "workspaceNotFound";
		} else if (!$this->get('app.workspace_levels')->hasRight($this->getUser(), $workspace, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$oldDefaultLevel = $manager->getRepository("TwakeWorkspacesBundle:Level")->findOneBy(Array("groupe" => $workspace, "isDefault" => true));

			if ($oldDefaultLevel != null) {
				$oldDefaultLevel->setDefault(false);
				$manager->persist($oldDefaultLevel);
			}

			$level->setDefault(true);
			$manager->persist($level);
		}

		$manager->flush();
		return new JsonResponse($data);
	}

	public function setLevelLinkAction(Request $request) {
		$manager = $this->getDoctrine()->getManager();
		$parentWorkspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupParentId"),"isDeleted"=>false));
		$childWorkspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupChildId"),"isDeleted"=>false));
		$linkWorkspaceParent = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceParent")->findOneBy(Array("parent" => $parentWorkspace, "child" => $childWorkspace));
		$level = $manager->getRepository("TwakeWorkspacesBundle:Level")->find($request->request->get("level"));
		/* type=0 => parent to child, type=1 => child to parent */
		$type = $request->request->get("type");
		$data = Array(
			"errors" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if($parentWorkspace == null){
			$data['errors'][] = "parentgroupnotfound";
		}
		else if($childWorkspace == null){
			$data['errors'][] = "childgroupnotfound";
		}
		else if($level == null){
			$data['errors'][] = "levelnotfound";
		}
		else if($type!=0 && $type!=1){
			$data['errors'][] = "typenotfound";
		}
		else if($linkWorkspaceParent == null){
			$data['errors'][] = "groupnotlinked";
		}
		else if($level->getGroup() != $childWorkspace && $level->getGroup() != $parentWorkspace){
			$data['errors'][] = "groupshasnotthislevel";
		}
		else if( $type==0 && !$this->get('app.levelManager')->hasRight($this->getUser(), $childWorkspace, 'base:links:edit')	){
			$data['errors'][] = "notallowed";
		}
		else if( $type==1 && !$this->get('app.levelManager')->hasRight($this->getUser(), $parentWorkspace, 'base:links:edit')	){

			$data['errors'][] = "notallowed";
		}
		else {
			if($type==0){
				$linkWorkspaceParent->setParentToChildLevel($level);
			}
			else{
				$linkWorkspaceParent->setChildToParentLevel($level);
			}
			$manager->persist($linkWorkspaceParent);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

}
