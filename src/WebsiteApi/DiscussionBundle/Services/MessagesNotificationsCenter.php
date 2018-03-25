<?php

namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\MessageNotification;
use WebsiteApi\DiscussionBundle\Model\MessagesNotificationsCenterInterface;


class MessagesNotificationsCenter implements MessagesNotificationsCenterInterface
{

    var $doctrine;
    var $notificationSystem;
    var $pusher;

    function __construct($doctrine,$notificationSystem, $pusher){
        $this->doctrine = $doctrine;
        $this->notificationSystem = $notificationSystem;
	    $this->pusher = $pusher;
    }

	public function read($stream, $user){

		$linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findOneBy(Array("user"=>$user,"stream"=>$stream));

		if(!$linkStream){
			return true;
		}

		$linkStream->setUnread(0);
		$this->doctrine->persist($linkStream);
		$this->doctrine->flush();

		$data = Array(
			"id" => $stream->getId(),
			"value" => 0
		);

		$this->pusher->push($data,
			"discussion_notifications_topic",
			Array("user_id" => $user->getId(), "stream_id"=>$stream->getId()));

	}

	public function notify($stream, $except_users_ids, $message){

		$users = Array();
		$linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findby(Array("stream" => $stream));
		foreach($linkStream as $link){
			if(!$linkStream->getMute() && !in_array($link->getUser()->getId(), $except_users_ids)){

				$users[] = $link->getUser();

				$linkStream->setUnread($linkStream->getUnread()+1);
				$this->doctrine->persist($linkStream);

				$data = Array(
					"id" => $stream->getId(),
					"value" => $linkStream->getUnread()
				);

				$this->pusher->push($data,
					"discussion_notifications_topic",
					Array(
						"user_id" => $link->getUser()->getId(),
						"stream_id"=>$stream->getId()
					)
				);
			}
		}

		$this->sendNotification($message, $stream->getWorkspace(), $users);

		$this->doctrine->flush();

	}

	public function streamIsRead($stream,$user){
    	

	    $linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
		    ->findOneBy(Array("user"=>$user,"stream"=>$stream));

	    if(!$linkStream){
		    return true;
	    }

	    return $linkStream->getUnread()==0;
    }


	public function sendNotification($message, $workspace, $users)
	{
		$application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
			->findOneBy(Array("url" => "messages-auto"));
		if ($message->getStreamReciever()->getType() != "user") {
			if ($message->getIsSystemMessage()) {
				return;
			} elseif ($message->getIsApplicationMessage()) {
				$msg = "#" . $message->getStreamReciever()->getName();
			} else {
				$msg = "#" . $message->getStreamReciever()->getName() . " : @" . $message->getUserSender()->getUsername() . " " . $message->getContent();
			}
		} else {
			$msg = "@" . $message->getUserSender()->getUsername() . " : " . $message->getContent();
		}
		$this->notificationSystem->pushNotification($application, $workspace, $users, null, null, $msg, Array("push"));
	}

}