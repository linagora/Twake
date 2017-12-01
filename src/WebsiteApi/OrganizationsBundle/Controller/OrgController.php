<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 19/01/2017
 * Time: 10:38
 */

namespace WebsiteApi\OrganizationsBundle\Controller;
use WebsiteApi\OrganizationsBundle\Entity\LinkOrgaUser;
use WebsiteApi\OrganizationsBundle\Entity\Orga;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class OrgController extends Controller
{
	/**
	 * Récupère les informations de base d'un groupe
	 */
	public function getAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}

		$orgId = $request->request->getInt("groupId");

    $org = $this->getDoctrine()->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("id"=>$orgId,"isDeleted"=>false));

		if($org==null){
			$response["errors"][] = "groupnotfound";
		}

		if(count($response["errors"])==0){
			$levelManager = $this->get('app.groups.access');
			$rightData = $levelManager->getRight($this->getUser(),$org);

			$response["data"] = $org->getAsSimpleArray();
			$response["data"] = array_merge($response["data"],$rightData["data"]);
			$response["data"] =  array_merge($response["data"],Array("levels" => $levelManager->quickLevel($org)));
		}

		return new JsonResponse($response);
	}

	public function getByCodeAction(Request $request){

		$response = Array("errors"=>Array(), "data"=>Array());

		$securityContext = $this->get('security.authorization_checker');
		if (!$securityContext->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
			$data['errors'][] = "notconnected";
		}

		$orgId = $request->request->get("groupCode");
		$org = $this->getDoctrine()->getRepository("TwakeOrganizationsBundle:Orga")->findOneBy(Array("keyCode"=>$orgId,"isDeleted"=>false));

		if($org==null){
			$response["errors"][] = "groupnotfound";
		}

		if(count($response["errors"])==0){
			$levelManager = $this->get('app.groups.access');
			$rightData = $levelManager->getRight($this->getUser(),$org);

			$response["data"] = $org->getAsSimpleArray();
			$response["data"] = array_merge($response["data"],$rightData["data"]);
			$response["data"] =  array_merge($response["data"],Array("levels" => $levelManager->quickLevel($org)));
		}

		return new JsonResponse($response);
	}

}
