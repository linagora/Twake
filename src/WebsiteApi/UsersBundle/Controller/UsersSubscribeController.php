<?php


namespace WebsiteApi\UsersBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UsersSubscribeController extends Controller
{


	public function mailAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);


		$email = $request->request->get("email", "");

		$res = $this->get("app.user")->subscribeMail($email);

		if ($res) {

			$data["data"]["token"] = $res;

		} else {

			$data["errors"][] = "alreadyused";

		}

		return new JsonResponse($data);

	}


	public function verifyMailAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$code = $request->request->get("code", "");
		$token = $request->request->get("token", "");

		$res = $this->get("app.user")->checkNumberForSubscribe($token, $code);

		if ($res) {

			$data["data"]["status"] = "success";

		} else {

			$data["errors"][] = "badcode";

		}

		return new JsonResponse($data);

	}


	public function subscribeAction(Request $request)
	{

		$data = Array(
			"errors" => Array(),
			"data" => Array()
		);

		$code = $request->request->get("code", "");
		$token = $request->request->get("token", "");
		$username = $request->request->get("username", "");
		$password = $request->request->get("password", "");

		$res = $this->get("app.user")->subscribe($token, $code, $username, $password);

		if ($res || $this->get("app.user")->current()) {

			$data["data"]["status"] = "success";

		} else {

			$data["errors"][] = "badusername";

		}

		return new JsonResponse($data);

	}

	public function getAvaibleAction(Request $request){
        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $mail = $request->request->get("mail", "");
        $username = $request->request->get("username", "");



        $res = $this->get("app.user")->getAvaibleMailPseudo($mail,$username);

        if(is_bool($res) && $res == true ){
            $data["data"]["status"] = "success";
        }
        elseif(is_array($res)){
            if(in_array(-1,$res)) {

                $data["errors"][] = "mailalreadytaken";

            }
            if(in_array(-2,$res)) {

                $data["errors"][] = "usernamealreadytaken";

            }
        }

        return new JsonResponse($data);
    }
    public function subscribeTotalyAction(Request $request){

        $data = Array(
            "errors" => Array(),
            "data" => Array()
        );

        $mail = $request->request->get("mail", "");
        $username = $request->request->get("username", "");
        $password = $request->request->get("password", "");
        $lastName = $request->request->get("lastName", "");
        $firstName = $request->request->get("firstName", "");
        $phone = $request->request->get("phone", "");
        $workspace = $request->request->get("workspace", "");
        $company = $request->request->get("company", "");
        $friends = $request->request->get("friends", "");
        $recaptcha = $request->request->get("recaptcha", "");
        $language = $request->request->get("language", "en");


        $res = $this->get("app.user")->subscribeInfo($mail, $password, $username, $firstName, $lastName, $phone, $workspace, $company, $friends, $recaptcha, $language);

        if ( $res==true && is_bool($res)) {

            $data["data"]["status"] = "success";

        }
        elseif(is_array($res)){
            if(in_array(-1,$res)) {

                $data["errors"][] = "mailalreadytaken";

            }
            if(in_array(-2,$res)) {

                $data["errors"][] = "usernamealreadytaken";

            }
        }
        else{
            $data["errors"][] = "error";
        }
        return new JsonResponse($data);
    }


}