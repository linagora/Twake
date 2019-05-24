<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UsersController extends Controller
{

    public function searchAction(Request $request)
    {

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $query = $request->request->get("query");
        $options = $request->request->get("options");

        if ($this->getUser()) {
            $options["language_preference"] = $this->getUser()->getLanguage();
        }

        $users = $this->get("app.users")->search(explode(" ", $query), $options);

        if ($users) {
            $data["data"] = $users;
        } else {
            $data["errors"][] = "an_error_occured";
        }

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