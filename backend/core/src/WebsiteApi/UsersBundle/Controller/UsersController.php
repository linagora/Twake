<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UsersController extends Controller
{

    public function searchAction(Request $request)
    {

        $scroll_id = $request->request->get("scroll_id");
        $repository = "TwakeUsersBundle:User";
        $options = $request->request->get("query", $request->request->get("options", Array()));

        if (is_string($options)) {
            $options = Array("name" => $options);
        }

        if (isset($scroll_id) && isset($repository)) {
            $globalresult = $this->get('globalsearch.pagination')->getnextelement($scroll_id, $repository);
        } else {
            $globalresult = $this->get("app.users")->search($options);
        }

        $data = Array("data" => $globalresult);

        return new JsonResponse($data);

    }

    public function getByIdAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $id = $request->request->get("id");
        $user = $this->get("app.users")->getById($id);

        if ($user) {
            $data["data"] = $user;
        } else {
            $data["errors"][] = "user_was_not_found";
        }

        return new JsonResponse($data);

    }

}