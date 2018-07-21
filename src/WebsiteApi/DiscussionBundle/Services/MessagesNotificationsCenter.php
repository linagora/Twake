<?php

namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\DiscussionBundle\Entity\MessageNotification;
use WebsiteApi\DiscussionBundle\Entity\StreamMember;
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

	public function read($stream, $user, $force=false, $noflush = false){

		$linkStream = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
			->findOneBy(Array("user"=>$user,"stream"=>$stream));

		if(!$linkStream){
			return true;
		}

        /** @var StreamMember $linkStream */
        $linkStream->setUnread(0);
        $linkStream->setSubjectUnread(0);
        $linkStream->setLastRead();
        $this->doctrine->persist($linkStream);

        // Read from notifications repository


        if ($noflush == false){

            $data = Array(
                "action" => "remove_messages_from",
                "stream" => $stream->getId()
            );
            //convert
            $this->pusher->push($data, "notifications/" . $user->getId());

            $this->doctrine->flush();


            $workspace = (
            $stream->getWorkspace()
                ? $stream->getWorkspace()
                : null
            );
            $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
                ->findOneBy(Array("url" => "messages-auto"));
            $this->notificationSystem->readAll($application, $workspace, $user, $stream->getId(), $force);

            $this->doctrine->clear();
        }

        $data = $linkStream->getAsArray();
        $data["id"] = $stream->getId();

        $this->pusher->push($data,
            "discussion_notifications/".$linkStream->getUser()->getId()
            ."/".($stream->getWorkspace()?$stream->getWorkspace()->getId():"")
        );

	}

	public function readAll($user){
        $listStreamMember = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findUnreadMessage($user);

        $ok = true;
        foreach ($listStreamMember as $streamMember){
            try {
                $stream = $streamMember->getStream();
                $ok = $ok && $this->read($stream, $user, false, true);
            } catch (\Exception $e) {
                error_log("missing entity");
            }
        }
        $this->doctrine->flush();

        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
            ->findOneBy(Array("url" => "messages-auto"));
        $this->notificationSystem->readAll($application, null, $user);

        $data = Array(
            "action" => "remove_all_messages"
        );
        //convert
        $this->pusher->push($data, "notifications/" . $user->getId());

        return $ok;
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

                $link->setLastUpdate();
                $link->setUnread($link->getUnread() + 1);
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

        $this->sendNotification($message, $workspace, $users, $stream);

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


    public function sendNotification(Message $message, $workspace, $users, $stream)
	{
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")
            ->findOneBy(Array("url" => "messages-auto"));

        $data = Array("app" => $application->getId(), "shortcut" => $message->getId() . "_" . $stream->getId());
        $code = $stream->getId();

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
        $this->notificationSystem->pushNotification($application->getId(), $workspace->getId(), $users, null, $code, $msg, Array("push"), $data);
	}

}