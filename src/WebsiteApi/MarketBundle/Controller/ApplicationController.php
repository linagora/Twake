<?php

/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace WebsiteApi\MarketBundle\Controller;

use DevelopersApi\UsersBundle\Entity\Token;
use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\MarketBundle\Entity\Application;

class ApplicationController extends Controller
{

    public function searchAction(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $group_id = $request->request->get("group_id");
        $query = $request->request->get("query");

        $res = $this->get("app.applications")->search($group_id, $query, $this->getUser()->getId());
        $data["data"] = $res;

        return new JsonResponse($data);

    }

	public function getUserTokenAction(Request $request){

        $manager = $this->get("app.twake_doctrine");

		$data = array(
			"data" => Array(),
			'errors' => Array()
		);


        $appid = $request->request->get("appid", 0);
        $groupId = $request->request->get("workspaceId", 0);

		$app = $manager->getRepository("TwakeMarketBundle:Application")
            ->find($appid);

		if (!$this->get('app.workspace_levels')->can($groupId, $this->getUser()->getId(), "")) {
			$data['errors'][] = "notallowed";
		} else {

			$useringroup = $manager->getRepository("TwakeWorkspacesBundle:WorkspaceUser")
				->findOneBy(Array("user"=>$this->getUser(),"workspace"=>$groupId));

			//Delete old tokens (1 minutes)
			$qb = $manager->createQueryBuilder();
			$qb->delete('DevelopersApiUsersBundle:Token', 't');
			$qb->where('t.date < :mindate');
			$qb->setParameter('mindate', (new \DateTime())->modify('-1 minute'));

			//Ok
			$tokenE = new Token();
			$tokenE->setUser($this->getUser());
			$tokenE->setWorkspace($useringroup->getWorkspace());
			$tokenE->setApplication($app);

			$manager->persist($tokenE);
			$manager->flush();

			$token = $tokenE->getToken();

			$data["data"]["token"] = $token;

		}

		return new JsonResponse($data);

	}



}
