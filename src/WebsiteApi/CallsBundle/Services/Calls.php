<?php


namespace WebsiteApi\CallsBundle\Services;

use WebsiteApi\CallsBundle\Entity\Call;
use WebsiteApi\CallsBundle\Entity\CallMember;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\CallsBundle\Model\CallSystemInterface;
/**
 * Manage calls
 */
class Calls implements CallSystemInterface
{

	var $string_cleaner;
	var $doctrine;
	var $security;
	var $notifications;
    var $messageSystem;
	var $pusher;

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $messageSystem, $pusher)
	{
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
        $this->messageSystem = $messageSystem;
		$this->pusher = $pusher;
	}

	public function getCallInfo($user, $discussionKey)
	{

		if (!$this->messageSystem->isAllowed($user, $discussionKey)) {
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
		if ($this->messageSystem->isAllowed($user, $discussionKey)) {
			$this->exitAllCalls($user);

			$call = $this->getCall($discussionKey,$user);

			$callMember = new CallMember($call, $user);
			$call->setNbclients($call->getNbclients() + 1);

            $this->doctrine->persist($call);
            $this->doctrine->persist($callMember);
			$this->doctrine->flush();

			$this->notifyChange($discussionKey,"join");
			return $call->getToken();
		}

		return null;

	}

	public function exitCalls($user){
		$this->exitAllCalls($user);
		error_log("end exitCalls");
	}

	private function getCall($discussionKey,$user)
	{

		$em = $this->doctrine;
		$repoCalls = $em->getRepository("TwakeCallsBundle:Call");
		$call = $repoCalls->findOneBy(Array("discussionKey" => $discussionKey));

		if ($call) {
			return $call;
		}

		$discussionInfos = $this->messageSystem->convertKey($discussionKey, $user);

		$content = "<div style=''>
                        ".$user->getFirstName()." ".$user->getLastName()." start a call
                    </div>";

        $message = $this->messageSystem->sendMessage($user->getId(), $discussionInfos["type"], $discussionInfos["id"], false,null,true, $content, null );
        $messageArray = $message->getAsArray();
        $this->messageSystem->notify($discussionKey,"C",$messageArray);
        $call = new Call($discussionKey,$message);

        $this->doctrine->persist($call);
        $this->doctrine->flush();

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
                $message = $call->getMessage();

			    $now = new \DateTime();
			    $during = $now->diff($message->getDate());
			    $format = "";
                if($during->h !== 0) {
                    $format = $format."%h h ";
                }
                if($during->i !== 0) {
                    $format = $format."%i m ";
                }
                if($during->s !== 0) {
                    $format = $format."%s s";
                }
                $content = "<div style=''>
                                <span style='color:#427FB3'>".$user->getFirstName()." ".$user->getLastName()."</span> called (".$during->format($format).")
                            </div>";
                $message->setContent($content);
                $em->persist($message);
                $em->flush();
                $this->messageSystem->notify($call->getDiscussionKey(),"E",$message->getAsArray());
                $em->remove($call);
				$torefresh[] = Array("discussionKey"=>$call->getDiscussionKey(),"type"=>"close");
            }else{
				$call->setNbclients($call->getNbclients()-1);
                $torefresh[] = Array("discussionKey" => $call->getDiscussionKey(),"type"=>"join");
				$em->persist($call);
			}
		}
		$em->flush();
		foreach ($torefresh as $call) {
			$this->notifyChange($call["discussionKey"],$call["type"]);
		}
	}


	/* Join Call */
	private function notifyChange($discussionKey,$type)
	{
	    // $type = "join", "close"
		$datatopush = Array(
			"type"=>"CALLS",
			"data"=>Array(
			    "type" => $type,
			    "discussionKey" => $discussionKey,
            )
		);
		$this->pusher->push($datatopush, "discussion_topic",Array("key"=>$discussionKey));

	}




}
