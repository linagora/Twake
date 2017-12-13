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
use Doctrine\DBAL\Platforms\Keywords\OracleKeywords;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use WebsiteApi\DiscussionBundle\Entity\Channel;

class WorkspaceLinksController extends Controller
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

    $child = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("childId"),"isDeleted"=>false));
    $parent = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("parentId"),"isDeleted"=>false));

    if (count($this->getLink($child, $parent)) != 0){
      $data['errors'][] = "demandpending";
      return new JsonResponse($data);
    }
    if ($child == null || $parent == null){
      $data["errors"][] = "nosuchworkspace";
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


    $parentLink = new LinkWorkspaceParent();
    $parentLink->setChild($child);
    $parentLink->setParent($parent);
    $parentLink->setAsker($askerL);
    $parentLink->setStatus("P");
    $parentLink->setParentToChildLevel(null);

    $manager->persist($parentLink);
    $manager->flush();

    return new JsonResponse($data);
  }

  public function getLink($workspace1, $workspace2){
    $manager = $this->getDoctrine()->getManager();
    $links = $manager->createQueryBuilder()
      ->select('l')
      ->from('TwakeWorkspacesBundle:LinkWorkspaceParent', 'l')
      ->where('(l.parent = :workspace1 AND l.child = :workspace2)')
      ->orWhere('(l.parent = :workspace2 AND l.child = :workspace1)' )
      ->setParameter('workspace1', $workspace1)
      ->setParameter('workspace2', $workspace2)
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

    $workspaceId = $request->request->get("groupId");
    $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$workspaceId,"isDeleted"=>false));

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "base:links:view")) {
	  $response["errors"][] = "notallowed";
	  return new JsonResponse($data);
	}

    if ($workspace == null){
      $data["errors"][] = "nosuchworkspace";
      return new JsonResponse($data);
    }

    $links = $manager->createQueryBuilder()
      ->select('l')
      ->from('TwakeWorkspacesBundle:LinkWorkspaceParent', 'l')
      ->where('(l.parent = :workspace)')
      ->orWhere('(l.child = :workspace)' )
      ->setParameter('workspace', $workspace)
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

    $workspace1 = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->find($request->request->get("id1"));
    $workspace2 = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->find($request->request->get("id2"));
    if ($workspace1 == null || $workspace2 == null){
      $data["errors"][] = "nosuchworkspace";
      return new JsonResponse($data);
    }
    $dt = $this->getLink($workspace1,$workspace2);

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

    $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "base:links:edit")) {
		$response["errors"][] = "notallowed";
		return new JsonResponse($data);
	}

    if ($workspace == null){
      $data["errors"][] = "nosuchworkspace";
      return new JsonResponse($data);
    }

    $link = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceParent")->find($request->request->get('linkId'));

    if ($link == null){
      $data["errors"][] = "nosuchlink";
      return new JsonResponse($data);
    }

    if ($link->getStatus() == "P"){
      if (($link->getParent() == $workspace && $link->getAsker() == "C") || ($link->getChild() == $workspace && $link->getAsker() == "P")) {
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

    $workspace = $manager->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$request->request->get("groupId"),"isDeleted"=>false));

	  if (!$this->get('app.groups.access')->hasRight($this->getUser(), $workspace, "base:links:edit")) {
		$response["errors"][] = "notallowed";
		return new JsonResponse($data);
	}

    if ($workspace == null){
      $data["errors"][] = "nosuchworkspace";
      return new JsonResponse($data);
    }

    $link = $manager->getRepository("TwakeWorkspacesBundle:LinkWorkspaceParent")->find($request->request->get('linkId'));

    if ($link == null){
      $data["errors"][] = "nosuchlink";
      return new JsonResponse($data);
    }


    if ($link->getParent() == $workspace || $link->getChild() == $workspace) {
      $manager->remove($link);
      $manager->flush();
    } else {
      $data["errors"][] = "cantremove";
    }


    return new JsonResponse($data);

  }

}
