<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 17/01/2017
 * Time: 14:34
 */

namespace WebsiteApi\OrganizationsBundle\Controller;


use WebsiteApi\OrganizationsBundle\Entity\Level;
use WebsiteApi\OrganizationsBundle\Entity\LinkOrgaParent;
use WebsiteApi\OrganizationsBundle\Entity\LinkOrgaUser;
use WebsiteApi\OrganizationsBundle\Entity\Orga;
use WebsiteApi\MarketBundle\Entity\LinkAppOrga;
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Channel;

class OrganizationStructureController extends Controller
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

			// Creation of the organization
			$organization = new Orga();
			$organization->setName($request->request->get("name"));
			$organization->setCleanName($this->get('app.string_cleaner')->simplify($request->request->get("name")));
			$organization->setType($request->request->get("type"));
			$organization->setDescription("");
			$organization->setPrivacy($request->request->get("privacy"));
			$organization->setStreet("");
			$organization->setCity("");
			$organization->setZipCode("");
			$organization->setCountry("");
			$organization->setPhones("");
			$organization->setEmails("");
			$organization->setSiret("");
			$organization->setRna("");
			$organization->setMemberCount(1);
			$organization->setKeyCode($organization->getKeyFromId($organization->getId()));
			$organization->setPaymaster($organization);


			// Creation of the link between the connected user and the organization
			$user = $this->getUser();
			$userLink = new LinkOrgaUser();
			$userLink->setUser($user);
			$userLink->setGroup($organization);
			$userLink->setStatus("A");

			$levelAdmin = new Level();
			$levelAdmin->setName("Admin");
			$levelAdmin->setGroup($organization);
			$levelAdmin->setRight(Array());
			$levelAdmin->setOwner(1);
			$levelAdmin->setDefault(false);
			$userLink->setLevel($levelAdmin);

			$levelDefault = new Level();
			$levelDefault->setName("Default");
			$levelDefault->setGroup($organization);
			$levelDefault->setRight($droitDefault);
			$levelDefault->setOwner(0);
			$levelDefault->setDefault(true);

			$generalChannel = new Channel($organization, "General", false);
			$link = $generalChannel->addMember($this->getUser());

			// Création of the link between the group and the basic applications
			$messagerie = $manager->getRepository('TwakeMarketBundle:Application')->findOneBy(Array('name' => "Messages"));
			$drive = $manager->getRepository('TwakeMarketBundle:Application')->findOneBy(Array('name' => "Drive"));
			$linkMessagerie = new LinkAppOrga();
			$linkMessagerie->setGroup($organization);
			$linkMessagerie->setApplication($messagerie);
			$linkMessagerie->setPrice(0);


			// Ajout du lien avec le drive
			$linkDrive = new LinkAppOrga();
			$linkDrive->setGroup($organization);
			$linkDrive->setApplication($drive);
			$linkDrive->setPrice(0);


			// Mise a jout du compte d'utilisateurs de la messagerie et du drive
			$messagerie->addUser();
			$drive->addUser();
			// Insertion in the database
			if (count($data["errors"]) == 0) {
				$manager->persist($generalChannel);
				$manager->persist($organization);
				$manager->persist($link);
				$manager->persist($userLink);
				$manager->persist($levelAdmin);
				$manager->persist($levelDefault);
				$manager->persist($linkMessagerie);
				$manager->persist($linkDrive);
				$manager->persist($messagerie);
				$manager->persist($drive);
				$manager->flush();

				$data["gid"] = $organization->getId();
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
			$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("gid"),"isDeleted"=>false));

			if ($organization == null) {

				$data['errors'][] = "groupnotfound";
			} else {

				$linkOrgaUser = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaUser")->findOneBy(Array("User" => $user, "Orga" => $organization));

				if ($linkOrgaUser == null || !$this->get('app.groups.access')->hasRight($user, $organization, 'base:groupe:delete')) {

					$data['errors'][] = "notallowed";
				} else {

				    $organization->setIsDeleted(true);
				    $manager->persist($organization);
				    $manager->flush();
				    /* vrai suppression
					$organizationMembersLinks = $organization->getMembers();
					foreach ($organizationMembersLinks as $memberLink) {
						$manager->remove($memberLink);
					}

					$organizationLevels = $organization->getLevels();
					foreach ($organizationLevels as $level) {
						$manager->remove($level);
					}

					$organizationChannels = $organization->getChannels();
					foreach ($organizationChannels as $channel) {

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

					$manager->remove($organization);
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
			$organisations = $user->getOrganizationsPart($request->request->get("limit"), $request->request->get("offset"));

			foreach ($organisations as $organization) {
				$data['data']['groups'][] = Array(
					'id' => $organization->getId(),
					'name' => $organization->getName(),
					'description' => $organization->getDescription()
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
			$data['data'] = $user->getAllOrganizations();
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


		$userOrganisationsId = Array(0);

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

			$data['errors'][] = "notconnected";
		} else {

			$user = $this->getUser();

			$userOrganisationsLinks = $manager->createQueryBuilder()
				->select('l')
				->from('TwakeOrganizationsBundle:LinkOrgaUser', 'l')
				->where('l.User = :connectedUser')
				->setParameter('connectedUser', $user)
				->getQuery()
				->getResult();

			foreach ((Array)$userOrganisationsLinks as $organizationLink) {
				$userOrganisationsId[] = $organizationLink->getGroup()->getId();
			}
		}

		$organizations = $manager->createQueryBuilder()
			->select('o')
			->from('TwakeOrganizationsBundle:Orga', 'o')
			->where('o.privacy = \'P\' OR o.id IN (' . join(',', $userOrganisationsId) . ')')
			->andwhere('LOWER(o.name) LIKE :namePattern')
			->setParameter('namePattern', $request->request->get("firstCharacters") . "%")
			->setMaxResults($request->request->get("limit"))
			->setFirstResult($request->request->get("offset"))
			->getQuery()
			->getResult();


		foreach ((Array)$organizations as $organization) {
			$data['data']['groups'][] = $organization->getAsSimpleArray();
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
		$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

		if (!$this->get('app.groups.access')->organizationIsFound($organization)) {
			$data['errors'][] = "groupnotfound";
		} else {

			if (!$this->get('app.groups.access')->hasRight($user, $organization, 'base:groupe:view')) {
				$data['errors'][] = "accessdenied";
			} else {

				$data['data'] = $organization->getAsSimpleArray();

				$data['data']['memberCount'] = $organization->getMemberCount();
				$data['data']['type'] = $organization->getType();
				$data['data']['description'] = $organization->getDescription();
				$data['data']['privacy'] = $organization->getPrivacy();
				$data['data']['street'] = $organization->getStreet();
				$data['data']['city'] = $organization->getCity();
				$data['data']['zipCode'] = $organization->getZipCode();
				$data['data']['country'] = $organization->getCountry();
				$data['data']['phones'] = $organization->getPhones();
				$data['data']['emails'] = $organization->getEmails();
				$data['data']['rna'] = $organization->getRna();
				$data['data']['siret'] = $organization->getSiret();
				$data['data']['key'] = $organization->getKey();
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
			$organization = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->getInt("groupId"),"isDeleted"=>false));

			if (!$this->get('app.groups.access')->organizationIsFound($organization)) {
				$data['errors'][] = "groupnotfound";
			} else if ($request->request->get("data")["name"] == "") {
				$data['errors'][] = "emptyname";
			} else {

				if (!$this->get('app.groups.access')->hasRight($user, $organization, 'base:groupe:edit')) {
					$data['errors'][] = "accessdenied";
				} else {
					$organization->setName($request->request->get("data")["name"]);
					$organization->setCleanName($this->get('app.string_cleaner')->simplify($request->request->get("name")));
					$organization->setDescription($request->request->get("data")["description"]);

					if (!in_array($request->request->get("data")["privacy"], Array("P", "Q", "M"))) {
						$data['errors'][] = "badprivacy";
					} else {
						$organization->setPrivacy($request->request->get("data")["privacy"]);
					}

					$organization->setStreet($request->request->get("data")["street"]);
					$organization->setCity($request->request->get("data")["city"]);
					$organization->setZipCode($request->request->get("data")["zipCode"]);
					$organization->setCountry($request->request->get("data")["country"]);
					$organization->setPhones($request->request->get("data")["phones"]);
					$organization->setEmails($request->request->get("data")["emails"]);
					$organization->setRna($request->request->get("data")["rna"]);
					$organization->setSiret($request->request->get("data")["siret"]);

					$manager->persist($organization);
					$manager->flush();
					$this->get('app.updateGroup')->push($organization->getId());
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

		$orgaId = $request->request->getInt("groupId", 0);
		$orgaRepo = $this->getDoctrine()->getManager()->getRepository("TwakeOrganizationsBundle:Orga");
		$organization = $orgaRepo->findOneBy(Array("id"=>$orgaId,"isDeleted"=>false));

		$securityContext = $this->get('security.authorization_checker');

		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		} else if ($organization == null) {
			$data['errors'][] = "notallowed";
		} else if (!$this->get('app.groups.access')->hasRight($this->getUser(), $organization, 'base:groupe:edit')) {
			$data['errors'][] = "notallowed";
		} else {

			$currentLogo = $organization->getLogo();
			if ($currentLogo != null) {
				$currentLogo->deleteFromDisk();
				$this->getDoctrine()->getManager()->remove($currentLogo);
			}

			if (!isset($_FILES["file"])) {
				$organization->setLogo(null);
			} else {

				$res = $this->get("app.uploader")->uploadFiles($this->getUser(), $_FILES["file"], "logo");

				$data["errors"] = $res[0]["errors"];

				if (isset($res[0]) && isset($res[0]["file"])) {
					$organization->setLogo($res[0]["file"]);
				}
			}

			$this->getDoctrine()->getManager()->persist($organization);
			$this->getDoctrine()->getManager()->flush();
			$this->get('app.updateGroup')->push($organization->getId());

		}

		return new JsonResponse($data);

	}

	public function customizeAction(Request $request)
	{

		$data = array(
			"errors" => Array()
		);

		$orgaId = $request->request->getInt("groupId", 0);
		$orgaRepo = $this->getDoctrine()->getManager()->getRepository("TwakeOrganizationsBundle:Orga");
		$group = $orgaRepo->findOneBy(Array("id" => $orgaId, "isDeleted" => false));

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
