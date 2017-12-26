<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 17/01/2017
 * Time: 14:34
 */

namespace WebsiteApi\WorkspacesBundle\Controller;


use WebsiteApi\WorkspacesBundle\Entity\Level;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceParent;
use WebsiteApi\WorkspacesBundle\Entity\LinkWorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Stream;

class WorkspaceStructureController extends Controller
{

	public function createAction(Request $request)
	{
		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		} else {
			// Basic tests
			if (strlen($request->request->get("name")) == 0) {
				$data['errors'][] = "emptyName";
			}
			if (!in_array($request->request->get("type"), Array("P", "C", "A", "E", "I", "O"))) {
				$data['errors'][] = "badType";
			}
			if (!in_array($request->request->get("privacy"), Array("P", "Q", "M"))) {
				$data['errors'][] = "badPrivacy";
			}


			$droitDefault = Array(
				"base" => Array(
					"members" => Array(
						"invite" => false,
						"view" => true,
					),
					"links" => Array(
						"view" => true
					),

				),
				"Messages" => Array(
					"general" => Array(
						"view" => true,
						"post" => true
					)
				),
				"Drive" => Array(
					"general" => Array(
						"create" => true,
						"view" => true,
						"edit" => true
					)
				)
			);

			// Creation of the workspace
			$workspace = new Workspace();
			$workspace->setName($request->request->get("name"));
			$workspace->setCleanName($this->get('app.string_cleaner')->simplify($request->request->get("name")));
			$workspace->setType($request->request->get("type"));
			$workspace->setDescription("");
			$workspace->setPrivacy($request->request->get("privacy"));
			$workspace->setStreet("");
			$workspace->setCity("");
			$workspace->setZipCode("");
			$workspace->setCountry("");
			$workspace->setPhones("");
			$workspace->setEmails("");
			$workspace->setSiret("");
			$workspace->setRna("");
			$workspace->setMemberCount(1);
			$workspace->setKeyCode($workspace->getKeyFromId($workspace->getId()));
			$workspace->setPaymaster($workspace);


			// Creation of the link between the connected user and the workspace
			$user = $this->getUser();
			$userLink = new LinkWorkspaceUser();
			$userLink->setUser($user);
			$userLink->setGroup($workspace);
			$userLink->setStatus("A");

			$levelAdmin = new Level();
			$levelAdmin->setName("Admin");
			$levelAdmin->setGroup($workspace);
			$levelAdmin->setRight(Array());
			$levelAdmin->setOwner(1);
			$levelAdmin->setDefault(false);
			$userLink->setLevel($levelAdmin);

			$levelDefault = new Level();
			$levelDefault->setName("Default");
			$levelDefault->setGroup($workspace);
			$levelDefault->setRight($droitDefault);
			$levelDefault->setOwner(0);
			$levelDefault->setDefault(true);

			$generalChannel = new Stream($workspace, "General", false);
			$link = $generalChannel->addMember($this->getUser());

			// Création of the link between the group and the basic applications
			$messagerie = $manager->getRepository('TwakeMarketBundle:Application')->findOneBy(Array('name' => "Messages"));
			$drive = $manager->getRepository('TwakeMarketBundle:Application')->findOneBy(Array('name' => "Drive"));
			$linkMessagerie = new LinkAppWorkspace();
			$linkMessagerie->setGroup($workspace);
			$linkMessagerie->setApplication($messagerie);
			$linkMessagerie->setPrice(0);


			// Ajout du lien avec le drive
			$linkDrive = new LinkAppWorkspace();
			$linkDrive->setGroup($workspace);
			$linkDrive->setApplication($drive);
			$linkDrive->setPrice(0);


			// Mise a jout du compte d'utilisateurs de la messagerie et du drive
			$messagerie->addUser();
			$drive->addUser();
			// Insertion in the database
			if (count($data["errors"]) == 0) {
				$manager->persist($generalChannel);
				$manager->persist($workspace);
				$manager->persist($link);
				$manager->persist($userLink);
				$manager->persist($levelAdmin);
				$manager->persist($levelDefault);
				$manager->persist($linkMessagerie);
				$manager->persist($linkDrive);
				$manager->persist($messagerie);
				$manager->persist($drive);
				$manager->flush();

				$data["gid"] = $workspace->getId();
			}
		}

		return new JsonResponse($data);
	}

	public function deleteAction(Request $request)
	{

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		} else {

			$user = $this->getUser();
			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("gid"),"isDeleted"=>false));

			if ($workspace == null) {

				$data['errors'][] = "groupnotfound";
			} else {

				$linkWorkspaceUser = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceUser")->findOneBy(Array("User" => $user, "Workspace" => $workspace));

				if ($linkWorkspaceUser == null || !$this->get('app.groups.access')->hasRight($user, $workspace, 'base:groupe:delete')) {

					$data['errors'][] = "notallowed";
				} else {

				    $workspace->setIsDeleted(true);
				    $manager->persist($workspace);
				    $manager->flush();
				    /* vrai suppression
					$workspaceMembersLinks = $workspace->getMembers();
					foreach ($workspaceMembersLinks as $memberLink) {
						$manager->remove($memberLink);
					}

					$workspaceLevels = $workspace->getLevels();
					foreach ($workspaceLevels as $level) {
						$manager->remove($level);
					}

					$workspaceChannels = $workspace->getChannels();
					foreach ($workspaceChannels as $channel) {

						$links = $channel->getMembersLinks();
						foreach ($links as $link) {
							$manager->remove($link);
						}

						$messages = $channel->getMessages();
						foreach ($messages as $message) {
							$manager->remove($message);
						}

						$manager->remove($channel);
					}

					$manager->remove($workspace);
					$manager->flush();*/
				}
			}
		}

		return new JsonResponse($data);
	}

	public function getListUserAction(Request $request)
	{

		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array("groups" => Array()),
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		} else {

			$user = $this->getUser();
			$workspaces = $user->getWorkspacesPart($request->request->get("limit"), $request->request->get("offset"));

			foreach ($workspaces as $workspace) {
				$data['data']['groups'][] = Array(
					'id' => $workspace->getId(),
					'name' => $workspace->getName(),
					'description' => $workspace->getDescription()
				);
			}
		}

		return new JsonResponse($data);
	}

	public function getAllListUserAction(Request $request)
	{
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		} else {

			$user = $this->getUser();
			$data['data'] = $user->getAllWorkspaces();
		}

		return new JsonResponse($data);
	}

	public function getAction(Request $request)
	{

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array("groups" => Array()),
			"errors" => Array()
		);


		$userWorkspacesId = Array(0);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		} else {

			$user = $this->getUser();

			$userWorkspacesLinks = $manager->createQueryBuilder()
				->select('l')
				->from('TwakeWorkspacesBundle:LinkWorkspaceUser', 'l')
				->where('l.User = :connectedUser')
				->setParameter('connectedUser', $user)
				->getQuery()
				->getResult();

			foreach ((Array)$userWorkspacesLinks as $workspaceLink) {
				$userWorkspacesId[] = $workspaceLink->getGroup()->getId();
			}
		}

		$workspaces = $manager->createQueryBuilder()
			->select('o')
			->from('TwakeWorkspacesBundle:Workspace', 'o')
			->where('o.privacy = \'P\' OR o.id IN (' . join(',', $userWorkspacesId) . ')')
			->andwhere('LOWER(o.name) LIKE :namePattern')
			->setParameter('namePattern', $request->request->get("firstCharacters") . "%")
			->setMaxResults($request->request->get("limit"))
			->setFirstResult($request->request->get("offset"))
			->getQuery()
			->getResult();


		foreach ((Array)$workspaces as $workspace) {
			$data['data']['groups'][] = $workspace->getAsSimpleArray();
		}

		return new JsonResponse($data);
	}

	public function getMoreAction(Request $request)
	{

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array(),
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}

		$user = $this->getUser();
		$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

		if (!$this->get('app.groups.access')->workspaceIsFound($workspace)) {
			$data['errors'][] = "groupnotfound";
		} else {

			if (!$this->get('app.groups.access')->hasRight($user, $workspace, 'base:groupe:view')) {
				$data['errors'][] = "accessdenied";
			} else {

				$data['data'] = $workspace->getAsSimpleArray();

				$data['data']['memberCount'] = $workspace->getMemberCount();
				$data['data']['type'] = $workspace->getType();
				$data['data']['description'] = $workspace->getDescription();
				$data['data']['privacy'] = $workspace->getPrivacy();
				$data['data']['street'] = $workspace->getStreet();
				$data['data']['city'] = $workspace->getCity();
				$data['data']['zipCode'] = $workspace->getZipCode();
				$data['data']['country'] = $workspace->getCountry();
				$data['data']['phones'] = $workspace->getPhones();
				$data['data']['emails'] = $workspace->getEmails();
				$data['data']['rna'] = $workspace->getRna();
				$data['data']['siret'] = $workspace->getSiret();
				$data['data']['key'] = $workspace->getKey();
			}
		}

		return new JsonResponse($data);
	}

	public function setMoreAction(Request $request)
	{

		$manager = $this->getDoctrine()->getManager();
		$securityContext = $this->get('security.authorization_checker');
		$data = Array(
			"data" => Array("members" => Array()),
			"errors" => Array()
		);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		} else {

			$user = $this->getUser();
			$workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

			if (!$this->get('app.groups.access')->workspaceIsFound($workspace)) {
				$data['errors'][] = "groupnotfound";
			} else if ($request->request->get("data")["name"] == "") {
				$data['errors'][] = "emptyname";
			} else {

				if (!$this->get('app.groups.access')->hasRight($user, $workspace, 'base:groupe:edit')) {
					$data['errors'][] = "accessdenied";
				} else {
					$workspace->setName($request->request->get("data")["name"]);
					$workspace->setCleanName($this->get('app.string_cleaner')->simplify($request->request->get("name")));
					$workspace->setDescription($request->request->get("data")["description"]);

					if (!in_array($request->request->get("data")["privacy"], Array("P", "Q", "M"))) {
						$data['errors'][] = "badprivacy";
					} else {
						$workspace->setPrivacy($request->request->get("data")["privacy"]);
					}

					$workspace->setStreet($request->request->get("data")["street"]);
					$workspace->setCity($request->request->get("data")["city"]);
					$workspace->setZipCode($request->request->get("data")["zipCode"]);
					$workspace->setCountry($request->request->get("data")["country"]);
					$workspace->setPhones($request->request->get("data")["phones"]);
					$workspace->setEmails($request->request->get("data")["emails"]);
					$workspace->setRna($request->request->get("data")["rna"]);
					$workspace->setSiret($request->request->get("data")["siret"]);

					$manager->persist($workspace);
					$manager->flush();
					$this->get('app.updateGroup')->push($workspace->getId());
				}
			}
		}


		return new JsonResponse($data);
	}

	public function setLogoAction(Request $request)
	{

		$data = array(
			"errors" => Array()
		);

		$workspaceId = $request->request->getInt("groupId", 0);
		$workspaceRepo = $this->getDoctrine()->getManager()->getRepository("TwakeWorkspacesBundle:Workspace");
		$workspace = $workspaceRepo->findOneBy(Array("id"=>$workspaceId,"isDeleted"=>false));

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		} else if ($workspace == null) {
			$data['errors'][] = "notallowed";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, 'base:groupe:edit')) {
			$data['errors'][] = "notallowed";
		} else {

			$currentLogo = $workspace->getLogo();
			if ($currentLogo != null) {
				$currentLogo->deleteFromDisk();
				$this->getDoctrine()->getManager()->remove($currentLogo);
			}

			if (!isset($_FILES["file"])) {
				$workspace->setLogo(null);
			} else {

				$res = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["file"], "logo");

				$data["errors"] = $res[0]["errors"];

				if (isset($res[0]) && isset($res[0]["file"])) {
					$workspace->setLogo($res[0]["file"]);
				}
			}

			$this->getDoctrine()->getManager()->persist($workspace);
			$this->getDoctrine()->getManager()->flush();
			$this->get('app.updateGroup')->push($workspace->getId());

		}

		return new JsonResponse($data);

	}

	public function customizeAction(Request $request)
	{

		$data = array(
			"errors" => Array()
		);

		$workspaceId = $request->request->getInt("groupId", 0);
		$workspaceRepo = $this->getDoctrine()->getManager()->getRepository("TwakeWorkspacesBundle:Workspace");
		$group = $workspaceRepo->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

		$elements = $request->request->get("data", Array());

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		} else if ($group == null) {
			$data['errors'][] = "notallowed";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $group, 'base:groupe:edit')) {
			$data['errors'][] = "notallowed";
		} else {

			$customization = $group->getCustomizationData();

			foreach ($elements as $key => $value) {

				if (!is_array($customization)) {
					$customization = Array();
				}

				if (!isset($customization[$key])) {
					$customization[$key] = "";
				}

				$customization[$key] = $value;

			}

			$group->setCustomizationData($customization);

		}

		return new JsonResponse($data);

	}

}
