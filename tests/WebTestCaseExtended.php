<?php

namespace Tests;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use WebsiteApi\UsersBundle\Services\deleteUser;

class WebTestCaseExtended extends WebTestCase
{

    var $client;

    protected function getClient() {
    	return $this->client;
    }

    protected function api($route, $data)
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        $this->client->request('POST', $route, $data);
        return json_decode($this->client->getResponse()->getContent(), 1);
    }

    protected function getDoctrine()
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        return $this->client->getContainer()->get('doctrine.orm.entity_manager');
    }

    protected function get($service)
    {
        if (!isset($this->client)) {
            $this->client = static::createClient();
        }
        return $this->client->getContainer()->get($service);
    }


    /* Create account */
    protected function createUser($username, $email, $password)
    {
        $this->deleteUser($email);
        $res = $this->api('/ajax/users/register/check', Array(
            "_username" => $username,
            "_mail" => $email
        ));

        $repoUser = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $token = $repoUser->findOneBy(Array("username" => $username))->getConfirmationToken();
        $res = $this->api('/ajax/users/register/confirm/' . $token, Array(
            "token" => $token
        ));

        $res = $this->api('/ajax/users/register/end/validate', Array(
            "username" => $username,
            "password" => $password,
            "verify" => $password,
            "token" => $token
        ));

        return $res["status"];

    }

    /* Delete account */
    protected function deleteUser($email)
    {
        $repo = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $user = $repo->findOneBy(Array("email" => $email));
        if ($user == null){
            return "error";
        }

        $this->get("app.deleteUser")->deleteUser($user->getId());
        return "success";
    }


	/* Login */
	protected function login($username = "UnitTest", $password = "UnitTest1")
	{
		return $this->api("/ajax/users/login", Array(
			"_username" => $username,
			"_password" => $password
		));
	}


	/* logout */
	protected function logout()
	{
		$res = $this->api("/ajax/users/logout", Array());
		$this->client = static::createClient();
		return $res;
	}

	protected function removeGroup($gid) {

		return $this->api('/ajax/group/delete', Array(
			"gid" => $gid
		));
	}

	/*
	 * Retourne un array de la forme :
	 *
	 * Array(
	 *    "errors" : liste d'erreurs
	 *    "gid" : id du groupe créé
	 * );
	 * */
    protected function createGroup($emptyname = false, $type = "O", $privacy = "P", $parents = Array())
    {

        return $this->api('/ajax/group/create', Array(
            "name" => $emptyname ? "" : "Group name",
            "type" => $type,
            "description" => "Group description",
            "privacy" => $privacy,
            "parentsIdList" => $parents,
            "street" => "Group street",
            "city" => "Group city",
            "zipCode" => "ZIP",
            "country" => "Group country",
            "phonesList" => Array("0123456789", "9876543210"),
            "emailsList" => Array("email@email.com", "email2@email.com"),
            "rna" => "Group RNA",
            "siret" => "Group siret"
        ));
    }

    /*
     * Retourne un array de la forme :
	 *
	 * Array(
	 *    "errors" : liste d'erreurs
	 * );
     */
	public function inviteUserInGroup($groupId, $request) {

		return $this->api('/ajax/group/members/invite', Array(
			"request" => $request,
			"groupId" => $groupId
		));
	}

	/*
     * Retourne un array de la forme :
	 *
	 * Array(
	 *    "errors" : liste d'erreurs
	 * );
     */
	public function acceptGroupInvitation($groupId) {

		return $this->api('/ajax/group/members/invite/accept', Array(
			"groupId" => $groupId
		));
	}

	/*
	 * $mails et $usersId : de type Array
	 *
     * Retourne un array de la forme :
	 *
	 * Array(
	 *    "errors" : liste d'erreurs
	 * );
     */
	public function deleteMemberFromGroup($groupId, $mails, $usersId) {

		return $this->api('/ajax/group/members/delete', Array(
			"uids" => $usersId,
			"mails" => $mails,
			"groupId" => $groupId
		));
	}
}
