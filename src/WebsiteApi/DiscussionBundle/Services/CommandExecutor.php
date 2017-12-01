<?php


namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\UsersBundle\Services\Notifications;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

class CommandExecutor
{

	var $string_cleaner;
	var $doctrine;
	var $security;
	var $notifications;

	public function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker,Notifications $notifications){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->notifications = $notifications;
	}

	public function execute($content, $url = '') {

		$final_actions =  Array(
			"NOSAVE" => true,
			"CONTENT" => $content,
			"NONOTIF" => true
		);

		if(!preg_match("/[a-z]/i",$content[1])){
			$final_actions["NOSAVE"] = false;
			$final_actions["NONOTIF"] = false;
			return $final_actions;
		}

		/*error_log("=============== EXECUTE ===============", 3, "D:/error_log.log");

		if (preg_match_all('!@(.+)(?:\s|$)!U', $content, $matches)) {

			foreach ($matches as $match) {
			}
		}*/

		return $final_actions;

	}
}