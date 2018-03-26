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
			Array(
				"user_id" => $linkStream->getUser()->getId(),
				"workspace_id"=>($stream->getWorkspace()?$stream->getWorkspace()->getId():"")
			)
		);

		$otherStreams = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findBy(Array("user"=>$user,"workspace"=>$stream->getWorkspace(),"mute"=>false));

		error_log("========>".count($otherStreams));

		$totalUnread = 0;
		foreach ($otherStreams as $otherStream){
			$totalUnread += $otherStream->getUnread();
		}

		if($totalUnread==0){
			$application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
				->findOneBy(Array("url" => "messages-auto"));
			$this->notificationSystem->readAll($application, $stream->getWorkspace(), $user);
		}

	}

	public function notify($stream, $except_users_ids, $message){

		$users = Array();
		$linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findby(Array("stream" => $stream));
		foreach($linkStream as $link){
			if(!$link->getMute() && !in_array($link->getUser()->getId(), $except_users_ids)){

				$users[] = $link->getUser();

				$link->setUnread($link->getUnread()+1);
				$this->doctrine->persist($link);

				$data = Array(
					"id" => $stream->getId(),
					"value" => $link->getUnread()
				);

				$this->pusher->push($data,
					"discussion_notifications_topic",
					Array(
						"user_id" => $link->getUser()->getId(),
						"workspace_id"=>($stream->getWorkspace()?$stream->getWorkspace()->getId():"")
					)
				);
			}
		}

		$this->sendNotification($message, $stream->getWorkspace(), $users);

		$this->doctrine->flush();

	}

	public function streamNotifications($stream,$user){
    	

	    $linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
		    ->findOneBy(Array("user"=>$user,"stream"=>$stream));

	    if(!$linkStream){
		    return 0;
	    }

	    return $linkStream->getUnread();
    }


	public function sendNotification($message, $workspace, $users)
	{
		$application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
			->findOneBy(Array("url" => "messages-auto"));
		$channelName = $message->getStreamReciever()->getName();
		if($channelName[0]==":"){
			$channelName = substr($channelName, 1);
		}
		if ($message->getStreamReciever()->getType() != "user") {
			if ($message->getIsSystemMessage()) {
				return;
			} elseif ($message->getIsApplicationMessage()) {
				$msg = "#" . $channelName;
			} else {
				$msg = "#" . $channelName . " : @" . $message->getUserSender()->getUsername() . " " . $message->getContent();
			}
		} else {
			$msg = "@" . $message->getUserSender()->getUsername() . " : " . $message->getContent();
		}
		$this->notificationSystem->pushNotification($application, $workspace, $users, null, null, $msg, Array("push"));
	}

}