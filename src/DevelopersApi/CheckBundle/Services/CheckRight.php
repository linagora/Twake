<?php
namespace DevelopersApi\CheckBundle\Services;

use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\MarketBundle\Entity\LinkAppWorkspace;

class CheckRight
{
	var $doctrine;
	var $tokenStorage;
	var $authorizationChecker;

	public function __construct($doctrine)
	{
		$this->doctrine = $doctrine;
	}


	/**
	 * Check rights for an API request and return util data
	 * If an error occure the returned object contain the key "errors"
	 */
	public function getRequestData($request, $rightAsked = Array())
	{

		$request = @json_decode($request->getContent(), true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			$request = Array();
		}

		if (isset($request["data"])) {
			$requestData = $request["data"];
		} else {
			$requestData = [];
		}
		if (isset($request["global"])) {
			$requestGlobal = $request["global"];
		} else {
			return Array("errors" => [1010]);
		}

		if (isset($requestGlobal["publicKey"])) {
			$publicKey = $requestGlobal["publicKey"];
		} else {
			return Array("errors" => [1011]);
		}

		if (isset($requestGlobal["privateKey"])) {
			$privateKey = $requestGlobal["privateKey"];
		} else {
			return Array("errors" => [1012]);
		}

		if (isset($requestGlobal["groupId"])) {
			$groupId = $requestGlobal["groupId"];
		} else {
			return Array("errors" => [1014]);
		}

		$application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
			->findOneBy(Array("publicKey" => $publicKey));
		$group = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id"=>$groupId,"isDeleted"=>false));


		if ($application == null) {
			return Array("errors" => 1001);

		} elseif ($application->getPrivateKey() != $privateKey) {
			return Array("errors" => 1002);

		} elseif ($this->doctrine->getRepository("TwakeMarketBundle:LinkAppWorkspace")->findOneBy(Array("application" => $application, "workspace" => $group)) == null) {
			return Array("errors" => 1004);

		} else {

			//TODO verify asked rights against authorized rights

			/*foreach($rightAsked as $right){
				if( ! in_array($right,$application->getApplicationRight)){
					return($errors[$right]);
				}
			}*/

			return Array(
				"data" => $requestData,
				"application" => $application,
				"group" => $group
			);
		}
	}

}
