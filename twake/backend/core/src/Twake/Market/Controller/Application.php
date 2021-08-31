<?php

/**
 * Created by PhpStorm.
 * User: Romaric Mourgues
 * Date: 19/06/2017
 * Time: 11:56
 */

namespace Twake\Market\Controller;

use DevelopersApi\Users\Entity\Token;
use Common\BaseController;
use Common\Http\Response;
use Common\Http\Request;

class Application extends BaseController
{

    public function search(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $group_id = $request->request->get("group_id");
        $query = $request->request->get("query");

        $res = $this->get("app.applications")->search($group_id, $query, $this->getUser()->getId());
        $data["data"] = $res;

        return new Response($data);

    }

    public function find(Request $request)
    {

        $data = array(
            "data" => Array(),
            "errors" => Array()
        );

        $id = $request->request->get("id");

        $res = $this->get("app.applications")->find($id);
        $data["data"] = $res;

        return new Response($data);

    }

    public function getUserToken(Request $request)
    {

        $manager = $this->get("app.twake_doctrine");

        $data = array(
            "data" => Array(),
            'errors' => Array()
        );


        $appid = $request->request->get("appid", 0);
        $wId = $request->request->get("workspaceId", 0);

        $app = $manager->getRepository("Twake\Market:Application")
            ->find($appid);

        if (!$this->get('app.workspace_levels')->can($wId, $this->getUser()->getId(), "")) {
            $data['errors'][] = "notallowed";
        } else {

            $useringroup = $manager->getRepository("Twake\Workspaces:WorkspaceUser")
                ->findOneBy(Array("user_id" => $this->getUser()->getId(), "workspace_id" => $wId));

            //Delete old tokens (1 minutes)
            $qb = $manager->createQueryBuilder();
            $qb->delete('DevelopersApiUsers:Token', 't');
            $qb->where('t.date < :mindate');
            $qb->setParameter('mindate', (new \DateTime())->modify('-1 minute'));

            //Ok
            $tokenE = new Token();
            $tokenE->setUser($this->getUser());
            $tokenE->setWorkspace($useringroup->getWorkspace($manager)->getId());
            $tokenE->setApplication($app);

            $manager->persist($tokenE);
            $manager->flush();

            $token = $tokenE->getToken();

            $data["data"]["token"] = $token;

        }

        return new Response($data);

    }


}
