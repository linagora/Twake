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
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Channel;

class OrganizationLinksController extends Controller
{

  public function askLinkAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $securityContext = $this->get('security.authorization_checker');
    $data = Array(
      "errors" => Array()
    );

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
      return new JsonResponse($data);
    }
    if ($request->request->get("childId") == $request->request->get("parentId")){
      $data['errors'][] = "sameids";
      return new JsonResponse($data);
    }

    $asker = $request->request->get("askerId");

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $asker, "base:links:edit")) {
	    $response["errors"][] = "notallowed";
	    return new JsonResponse($data);
    }

    $child = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("childId"),"isDeleted"=>false));
    $parent = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("parentId"),"isDeleted"=>false));

    if (count($this->getLink($child, $parent)) != 0){
      $data['errors'][] = "demandpending";
      return new JsonResponse($data);
    }
    if ($child == null || $parent == null){
      $data["errors"][] = "nosuchorga";
      return new JsonResponse($data);
    }

    if ($asker == $request->request->get("childId")){
      $askerL = "C";
    } else if ( $asker == $request->request->get("parentId")) {
      $askerL = "P";
    } else {
      $data['errors'][] = "asker_not_child_nor_parent";
      return new JsonResponse($data);
    }


    $parentLink = new LinkOrgaParent();
    $parentLink->setChild($child);
    $parentLink->setParent($parent);
    $parentLink->setAsker($askerL);
    $parentLink->setStatus("P");
    $parentLink->setParentToChildLevel(null);

    $manager->persist($parentLink);
    $manager->flush();

    return new JsonResponse($data);
  }

  public function getLink($orga1, $orga2){
    $manager = $this->getDoctrine()->getManager();
    $links = $manager->createQueryBuilder()
      ->select('l')
      ->from('TwakeOrganizationsBundle:LinkOrgaParent', 'l')
      ->where('(l.parent = :orga1 AND l.child = :orga2)')
      ->orWhere('(l.parent = :orga2 AND l.child = :orga1)' )
      ->setParameter('orga1', $orga1)
      ->setParameter('orga2', $orga2)
      ->getQuery()
      ->getResult();

    $data = Array();

    if (count($links) > 0){
      $link = $links[0];
      $data = Array(
        "id" => $link->getId(),
        "parent" => $link->getParent()->getAsSimpleArray(),
        "child" => $link->getChild()->getAsSimpleArray(),
        "status" => $link->getStatus(),
        "asker" => $link->getAsker()
      );
    } else {
      // No Link, this is not an error, but nothing happens.
    }

    return $data;
  }

  public function getAllLinkAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $securityContext = $this->get('security.authorization_checker');
    $data = Array(
      "data" => Array(),
      "errors" => Array()
    );

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
      return new JsonResponse($data);
    }

    $orgaId = $request->request->get("groupId");
    $orga = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$orgaId,"isDeleted"=>false));

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $orga, "base:links:view")) {
	  $response["errors"][] = "notallowed";
	  return new JsonResponse($data);
	}

    if ($orga == null){
      $data["errors"][] = "nosuchorga";
      return new JsonResponse($data);
    }

    $links = $manager->createQueryBuilder()
      ->select('l')
      ->from('TwakeOrganizationsBundle:LinkOrgaParent', 'l')
      ->where('(l.parent = :orga)')
      ->orWhere('(l.child = :orga)' )
      ->setParameter('orga', $orga)
      ->getQuery()
      ->getResult();

    $dlinks = Array();
    for ($i = 0; $i<count($links); $i++){
      $link = $links[$i];

      $dlink = Array(
        "id" => $link->getId(),
        "parent" => $link->getParent()->getAsSimpleArray(),
        "child" => $link->getChild()->getAsSimpleArray(),
        "status" => $link->getStatus(),
        "asker" => $link->getAsker(),
	      "parentToChildLevel" =>  $link->getParentToChildLevel() == null ? Array() : $link->getParentToChildLevel()->getArray()
      );
      $dlinks[] = $dlink;
    }
    $data['data'] = $dlinks;
    return new JsonResponse($data);
  }



  /*public function getLinkAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $securityContext = $this->get('security.authorization_checker');
    $data = Array(
      "data" => Array(),
      "errors" => Array()
    );

    // TODO : droits

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
      return new JsonResponse($data);
    }

    $orga1 = $manager->getRepository("TwakeOrganizationsBundle:Orga")->find($request->request->get("id1"));
    $orga2 = $manager->getRepository("TwakeOrganizationsBundle:Orga")->find($request->request->get("id2"));
    if ($orga1 == null || $orga2 == null){
      $data["errors"][] = "nosuchorga";
      return new JsonResponse($data);
    }
    $dt = $this->getLink($orga1,$orga2);

    $data['data'] = $dt;

    return new JsonResponse($data);
  }*/

  public function acceptLinkAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $securityContext = $this->get('security.authorization_checker');
    $data = Array(
      "errors" => Array()
    );

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
      return new JsonResponse($data);
    }

    $orga = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $orga, "base:links:edit")) {
		$response["errors"][] = "notallowed";
		return new JsonResponse($data);
	}

    if ($orga == null){
      $data["errors"][] = "nosuchorga";
      return new JsonResponse($data);
    }

    $link = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaParent")->find($request->request->get('linkId'));

    if ($link == null){
      $data["errors"][] = "nosuchlink";
      return new JsonResponse($data);
    }

    if ($link->getStatus() == "P"){
      if (($link->getParent() == $orga && $link->getAsker() == "C") || ($link->getChild() == $orga && $link->getAsker() == "P")) {
        $link->setStatus('A');
        $manager->persist($link);
        $manager->flush();
      } else {
        $data["errors"][] = "cantaccept";
      }
    } else {
      $data["errors"][] = "nosuchlinktoaccept";
    }

    return new JsonResponse($data);

  }

  public function removeLinkAction(Request $request){
    $manager = $this->getDoctrine()->getManager();
    $securityContext = $this->get('security.authorization_checker');
    $data = Array(
      "errors" => Array()
    );

    if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {

      $data['errors'][] = "notconnected";
      return new JsonResponse($data);
    }

    $orga = $manager->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $orga, "base:links:edit")) {
		$response["errors"][] = "notallowed";
		return new JsonResponse($data);
	}

    if ($orga == null){
      $data["errors"][] = "nosuchorga";
      return new JsonResponse($data);
    }

    $link = $manager->getRepository("TwakeOrganizationsBundle:LinkOrgaParent")->find($request->request->get('linkId'));

    if ($link == null){
      $data["errors"][] = "nosuchlink";
      return new JsonResponse($data);
    }


    if ($link->getParent() == $orga || $link->getChild() == $orga) {
      $manager->remove($link);
      $manager->flush();
    } else {
      $data["errors"][] = "cantremove";
    }


    return new JsonResponse($data);

  }

}
