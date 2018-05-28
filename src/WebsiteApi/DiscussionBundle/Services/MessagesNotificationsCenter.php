<?php

namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\DiscussionBundle\Entity\MessageNotification;
use WebsiteApi\DiscussionBundle\Model\MessagesNotificationsCenterInterface;


class MessagesNotificationsCenter implements MessagesNotificationsCenterInterface
{

    var $doctrine;
    var $notificationSystem;
    var $pusher;
    var $workspaces;

    function __construct($doctrine,$notificationSystem, $pusher, $workspaces){
        $this->doctrine = $doctrine;
        $this->notificationSystem = $notificationSystem;
	    $this->pusher = $pusher;
		$this->workspaces = $workspaces;
    }

	public function read($stream, $user, $force=false){

		$linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findOneBy(Array("user"=>$user,"stream"=>$stream));

		if(!$linkStream){
			return true;
		}

        $linkStream->setUnread(0);
        $linkStream->setSubjectUnread(0);
        $linkStream->setLastRead();
        $this->doctrine->persist($linkStream);
        $this->doctrine->flush();

        $data = $linkStream->getAsArray();
        $data["id"] = $stream->getId();

        $this->pusher->push($data,
            "discussion_notifications/".$linkStream->getUser()->getId()
            ."/".($stream->getWorkspace()?$stream->getWorkspace()->getId():"")
        );

		$otherStreams = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findBy(Array("user"=>$user,"workspace"=>$stream->getWorkspace(),"mute"=>false));

		$totalUnread = 0;
		foreach ($otherStreams as $otherStream){
			$totalUnread += $otherStream->getUnread();
		}

		$workspace = (
			$stream->getWorkspace()
			?$stream->getWorkspace()
			:$this->workspaces->getPrivate($user->getId())
		);

		if($totalUnread<=0){
			$application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
				->findOneBy(Array("url" => "messages-auto"));
			$this->notificationSystem->readAll($application, $workspace, $user, null, $force);
		}

	}

    public function notify($stream, $except_users_ids, $message)
    {

        if (!$message) {
            return false;
        }

		$users = Array();
		$linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findby(Array("stream" => $stream, "mute" => false));
		foreach($linkStream as $link){
			if(!in_array($link->getUser()->getId(), $except_users_ids)){

				$users[] = $link->getUser()->getId();

				$link->setUnread($link->getUnread()+1);
				if($message->getSubject()){
                    $link->setSubjectUnread($link->getSubjectUnread()+1);
                }
				$this->doctrine->persist($link);

				$data = $link->getAsArray();
				$data["id"] = $stream->getId();

				$this->pusher->push($data,
                    "discussion_notifications/".$link->getUser()->getId()
                    ."/".($stream->getWorkspace()?$stream->getWorkspace()->getId():"")
				);



            }
		}

		if(count($users)==0){
			return;
		}

		$workspace = (
		$stream->getWorkspace()
			?$stream->getWorkspace()
			:$this->workspaces->getPrivate($users[0])
		);

		$this->sendNotification($message, $workspace, $users);

		$this->doctrine->flush();

	}

	public function streamNotifications($stream,$user){
    	

	    $linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
		    ->findOneBy(Array("user"=>$user,"stream"=>$stream));

	    if(!$linkStream){
		    return 0;
	    }

	    return $linkStream->getAsArray();
    }


	public function sendNotification($message, $workspace, $users)
	{
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
            ->findOneBy(Array("url" => "messages-auto"));
		if ($message->getStreamReciever()->getType() != "user") {
			$channelName = $message->getStreamReciever()->getName();
			if($channelName[0]==":"){
				$channelName = substr($channelName, 1);
			}
			if ($message->getIsSystemMessage()) {
				return;
			} elseif ($message->getIsApplicationMessage()) {
                $sender_application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
                    ->find($message->getApplicationSender());
                if ($sender_application) {
                    $msg = $sender_application->getName() . " added a message in #" . $channelName;
                }
			} else {
                $msg = "@" . $message->getUserSender()->getUsername() . " " . $message->getContent() . " in " . "#" . $channelName;
			}
		} else {
            if ($message->getIsApplicationMessage()) {
                $sender_application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
                    ->find($message->getApplicationSender());
                if ($sender_application) {
                    $msg = $sender_application->getName() . " added a message in a discussion with @" . $message->getUserSender()->getUsername();
                }
            } else {
                $msg = "@" . $message->getUserSender()->getUsername() . " : " . $message->getContent();
            }
		}
		$this->notificationSystem->pushNotification($application->getId(), $workspace->getId(), $users, null, null, $msg, Array("push"));
	}

}