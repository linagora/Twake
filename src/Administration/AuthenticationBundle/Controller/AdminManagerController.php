<?php


namespace Administration\AuthenticationBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Matcher\RedirectableUrlMatcher;

class AdminManagerController extends Controller
{
    public function addUserAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user == null)
        {
            $data["errors"][] = "disconnected";
        }
        else
        {
            $listRole = $user->getRoles();
            if(!in_array("AdminManager", $listRole))
            {
                $data["errors"][] = "not_allowed";
            }
            else
            {
                $id = $request->request->get("id", "");
                $userAdded = $this->get('admin.Management')->addUser($id);
                if ($userAdded == null) {
                    $data["errors"][] = "user_not_added";
                }
            }
        }


        return new JsonResponse($data);
    }

    public function removeUserAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
        if($user == null)
        {
            $data["errors"][] = "disconnected";
        }
        else
        {
            $listRole = $user->getRoles();
            if(!in_array("AdminManager", $listRole))
            {
                $data["errors"][] = "not_allowed";
            }
            else
            {
                $id = $request->request->get("id", "");
                $userDeleted = $this->get('admin.Management')->removeUser($id);
                if ($userDeleted == null) {
                    $data["errors"][] = "user_not_deleted";
                }
            }
        }

        return new JsonResponse($data);
    }

    public function updateUserAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );


        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);
            if ($user == null) {
                $data["errors"][] = "disconnected";
            } else {
                $listRole = $user->getRoles();
                if (!in_array("AdminManager", $listRole)) {
                    $data["errors"][] = "not_allowed";
                }
                else
                {
                    $id = $request->request->get("id", "");
                    $role = $request->request->get("role", "");

                    $userUpdated = $this->get('admin.Management')->updateUser($id, $role);
                    if ($userUpdated == null)
                    {
                        $data["errors"][] = "user_not_updated";
                    }
                }
            }
            return new JsonResponse($data);
    }

    public function listUserAdminAction(Request $request)
    {
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $user = $this->get('admin.Authentication')->verifyUserConnectionByHttpRequest($request);

        if($user == null)
        {
            $data["errors"][] = "disconnected";
        }
        else
        {
            $listRole = $user->getRoles();
            if(!in_array("AdminManager",$listRole))
            {
                $data["errors"][] = "not_allowed";
            }
            else
            {

                $listUserAdmin = $this->get('admin.Management')->listUserAdmin();
                $listResponse = Array();
                foreach($listUserAdmin as $userAdmin)
                {
                    $listResponse[] = Array(
                        "id" => $userAdmin->getUser()->getId(),
                        "username" => $userAdmin->getUser()->getUsername(),
                        "roles" => $userAdmin->getRoles()
                    );
                }
                $data["data"] = $listResponse;
            }
        }

        return new JsonResponse($data);
    }
}
