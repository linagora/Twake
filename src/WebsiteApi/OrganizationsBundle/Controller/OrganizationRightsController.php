<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 17/01/2017
 * Time: 14:34
 */

namespace WebsiteApi\OrganizationsBundle\Controller;


use WebsiteApi\OrganizationsBundle\Entity\LinkOrgaParent;
use WebsiteApi\OrganizationsBundle\Entity\LinkOrgaUser;
use WebsiteApi\OrganizationsBundle\Entity\Orga;
use WebsiteApi\OrganizationsBundle\Entity\Level;
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use WebsiteApi\OrganizationsBundle\Repository\LinkOrgaUserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class OrganizationRightsController extends Controller
{

    public function hasAccesAction(Request $request){
        $manager = $this->getDoctrine()->getManager();
        $securityContext = $this->get('security.authorization_checker');
        $data = Array(
            "data" => Array(),
            "errors" => Array()
        );
        $organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"), "isDeleted"=>false));
        if ($organization == null) {
            $data['errors'][] = "groupnotfound";
        }
        else {
            if($this->get('app.levelManager')->hasRight($this->getUser(), $organization, 'base')){
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
			$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

			if ($organization == null) {
				$data['errors'][] = "groupnotfound";
			}
			else {

				if (!$this->get('app.groups.access')->hasRight($user, $organization, 'base:right:viewOther')) {
					$data['errors'][] = "accessdenied";
				}
				else {
					$repositoryLevel = $manager->getRepository("TwakeOrganizationsBundle:Level");

					$repositoryLink = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaUser");
					$nb = $manager->createQueryBuilder()
						->select("IDENTITY(l.level), count(l.User)")
						->from("TwakeOrganizationsBundle:LinkOrgaUser", "l")
						->where("l.Orga=:organization")
						->setParameter("organization", $organization)
						->groupby("l.level")
						->getQuery()
			            ->getResult();

					$levels = $repositoryLevel->findBy(Array(
		                                        "groupe" => $organization
                            				));
						foreach($levels as $level){
							if($level->getOwner()){
								$right = $this->get('app.groups.access')->getRightsPossible($organization);
							}
							else{
								$right = $level->getRight();
							}


							$memberCount = $manager->createQueryBuilder()
								->select('COUNT(l)')
								->from("TwakeOrganizationsBundle:LinkOrgaUser", "l")
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
		$levelFrom = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneById($request->request->getInt("levelIdFrom"));
		$levelTo = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneById($request->request->getInt("levelIdTo"));
		$organization = $levelFrom->getGroup();

		$data = Array(
			"errors" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if($organization != $levelTo->getGroup()){
			$data['errors'][] = "differentgroup";
		}
		else if($levelFrom->getOwner()){
			$data['errors'][] = "notallowed";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{

			$memberLinkToModify = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findBy(Array("level" => $levelFrom));

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
		$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

		$data = Array(
			"errors" => Array(),
			"data" =>Array(),
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($organization == null){
			$data["errors"][] = "groupnotfound";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:right:viewOther')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$data["data"] = $this->get('app.groups.access')->getRightsPossible($organization);
		}
		return new JsonResponse($data);
	}

	public function createLevelAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$name = $request->request->get("name");


		$data = Array(
			"errors" => Array(),
		);

		if(!preg_match("/[a-z0-9]/i", $name)){
			$data["errors"][] = "empty";
		}else if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($organization == null){
			$data["errors"][] = "groupnotfound";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:level:create')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$defaultLevel = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneBy(Array("groupe"=>$organization,"isDefault"=>true));
			$level = new Level;
			$level->setName($name);
			$level->setRight($defaultLevel->getRight());
			$level->setGroup($organization);
			$level->setOwner(false);
			$level->setDefault(false);
			$manager->persist($level);
			$manager->flush();
		}
		return new JsonResponse($data);
	}



	public function changelevelUsersAction(Request $request){
		$manager = $this->getDoctrine()->getManager();
		$group = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneBy(Array("groupe"=>$group,"id"=>$request->request->get("levelId")));
		$links =  $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findBy( Array("Orga" => $group, "User"=>$request->request->get("uids")));
		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if ($group == null){
			$data["errors"][] = "orgaNotFound";
		}
		else if( $level == null){
			$data['errors'][] = "levelNotFound";
		}
		else if(count($links)<=0){
			$data["errors"][] = "usersNotFound";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $group, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{

			$groupOwnerCount = 0;
			$currentOwnerCount = 0;

			$links2 = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findBy(Array("Orga" => $group));
			foreach ($links2 as $link) {
				if ($link->getLevel()->getOwner()) {
					++$groupOwnerCount;
				}
			}

			$links2 = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findBy(Array("Orga" => $group, "User" => $request->request->get("uids")));
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
		$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneById($request->request->getInt("levelId"));
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
		else if ($organization == null){
			$data["errors"][] = "orgaNotFound";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:level:delete')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$levelIdArray = $request->request->getInt("levelId");
			$levelArray =  $manager->getRepository("TwakeOrganizationsBundle:Level")->findById($levelIdArray);
			foreach($levelArray as $level){
				if($level->getOwner()){
					$data["errors"][] = "levelOwner";
				}
				else if($level->getDefault()){
					$data["errors"][] = "levelDefault";
				}
				else{
					$defaultLevel = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneBy(Array("groupe"=>$organization, "isDefault"=>true));

					$links = $this->getDoctrine()->getManager()->createQueryBuilder();
					$links->update("TwakeOrganizationsBundle:LinkOrgaUser","l");
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
		$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneById($request->request->getInt("levelId"));
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
		else if ($organization == null){
			$data["errors"][] = "orgaNotFound";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:right:edite')) {
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
		$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));
		$level = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneById($request->request->getInt("levelId"));

		$data = Array(
			"errors" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if( $level == null){
			$data['errors'][] = "levelNotFound";
		}
		else if ($organization == null){
			$data["errors"][] = "orgaNotFound";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:right:edite')) {
			$data['errors'][] = "accessDenied";
		}
		else{
			$oldDefaultLevel = $manager->getRepository("TwakeOrganizationsBundle:Level")->findOneBy(Array("groupe" => $organization, "isDefault" => true));

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
		$parentOrganization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("groupParentId"),"isDeleted"=>false));
		$childOrganization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("groupChildId"),"isDeleted"=>false));
		$linkOrgaParent = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaParent")->findOneBy(Array("parent" => $parentOrganization, "child" => $childOrganization));
		$level = $manager->getRepository("TwakeOrganizationsBundle:Level")->find($request->request->get("level"));
		/* type=0 => parent to child, type=1 => child to parent */
		$type = $request->request->get("type");
		$data = Array(
			"errors" => Array()
		);

		if (!$this->get('security.authorization_checker')->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data["errors"][] = "notconnected";
		}
		else if($parentOrganization == null){
			$data['errors'][] = "parentgroupnotfound";
		}
		else if($childOrganization == null){
			$data['errors'][] = "childgroupnotfound";
		}
		else if($level == null){
			$data['errors'][] = "levelnotfound";
		}
		else if($type!=0 && $type!=1){
			$data['errors'][] = "typenotfound";
		}
		else if($linkOrgaParent == null){
			$data['errors'][] = "groupnotlinked";
		}
		else if($level->getGroup() != $childOrganization && $level->getGroup() != $parentOrganization){
			$data['errors'][] = "groupshasnotthislevel";
		}
		else if( $type==0 && !$this->get('app.levelManager')->hasRight($this->getUser(), $childOrganization, 'base:links:edit')	){
			$data['errors'][] = "notallowed";
		}
		else if( $type==1 && !$this->get('app.levelManager')->hasRight($this->getUser(), $parentOrganization, 'base:links:edit')	){

			$data['errors'][] = "notallowed";
		}
		else {
			if($type==0){
				$linkOrgaParent->setParentToChildLevel($level);
			}
			else{
				$linkOrgaParent->setChildToParentLevel($level);
			}
			$manager->persist($linkOrgaParent);
			$manager->flush();
		}

		return new JsonResponse($data);
	}

}
