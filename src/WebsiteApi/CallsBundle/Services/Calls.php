<?php


namespace WebsiteApi\CallsBundle\Services;

use WebsiteApi\CallsBundle\Entity\Call;
use WebsiteApi\CallsBundle\Entity\CallMember;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\UsersBundle\Services\Notifications;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;

/**
 * Manage calls
 */
class Calls
{

	var $string_cleaner;
	var $doctrine;
	var $security;
	var $notifications;
	var $pusher;

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, Notifications $notifications, $messageService, $pusher)
	{
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->notifications = $notifications;
		$this->messageService = $messageService;
		$this->pusher = $pusher;
	}

	public function getCallInfo($user, $discussionKey)
	{

		if (!$this->messageService->isAllowedByKey($user, $discussionKey)) {
			return Array("status" => "invalid");
		}

		$repoCalls = $this->doctrine->getRepository("TwakeCallsBundle:Call");
		$call = $repoCalls->findOneBy(Array("discussionKey" => $discussionKey));

		if ($call == null) {
			return Array("status" => "nocall");
		} else {
			$data = Array();

			$data["status"] = "started";
			$data["token"] = $call->getToken();

			$repoCalls = $this->doctrine->getRepository("TwakeCallsBundle:CallMember");
			$m = $repoCalls->findBy(Array("call" => $call));
			foreach ($m as $member) {
				if ($member->getUser()->getId() == $user->getId()) {
					$data["status"] = "joined";
				}
				$data["members"][] = $member->getUser()->getAsArray();
			}
			return $data;
		}

	}

	public function joinCall($user, $discussionKey)
	{
		if ($this->messageService->isAllowedByKey($user, $discussionKey)) {

			$em = $this->doctrine;

			$this->exitAllCalls($user);

			$call = $this->getCall($discussionKey);

			$callMember = new CallMember($call, $user);
			$call->setNbclients($call->getNbclients() + 1);

			$em->persist($callMember);
			$em->persist($call);
			$em->flush();

			$this->notifyChange($discussionKey);

			return $call->getToken();
		}

		return null;

	}

	public function exitCalls($user){
		$this->exitAllCalls($user);
	}

	private function getCall($discussionKey)
	{

		$em = $this->doctrine;
		$repoCalls = $em->getRepository("TwakeCallsBundle:Call");
		$call = $repoCalls->findOneBy(Array("discussionKey" => $discussionKey));

		if ($call) {
			return $call;
		}

		$call = new Call($discussionKey);

		return $call;

	}

	private function exitAllCalls($user)
	{

		$em = $this->doctrine;

		$repoCalls = $em->getRepository("TwakeCallsBundle:CallMember");
		$callMember = $repoCalls->findBy(Array("user"=>$user));

		$torefresh = Array();

		foreach($callMember as $member){

			$em->remove($member);
			$call = $member->getCall();

			if($call->getNbclients() <= 1){
				$em->remove($call);
				$torefresh[] = $call->getDiscussionKey();
			}else{
				$call->setNbclients($call->getNbclients()-1);
				$em->persist($call);
			}
		}

		$em->flush();

		foreach ($torefresh as $discussionKey) {
			$this->notifyChange($discussionKey);
		}

	}


	/* Join Call */
	private function notifyChange($discussionKey)
	{

		$datatopush = Array(
			"type"=>"CALLS",
			"data"=>""
		);
		$this->pusher->push($datatopush, "discussion_topic",Array("key"=>$discussionKey));

	}




}
