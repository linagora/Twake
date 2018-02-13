<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\UsersBundle\Entity\User;
use Symfony\Component\Security\Core\Authorization\AuthorizationChecker;
use WebsiteApi\DiscussionBundle\Model\MessagesSystemInterface;

/**
 * Manage contacts
 */
class MessageSystem implements MessagesSystemInterface
{

	var $string_cleaner;
	var $doctrine;
	var $security;
	var $commandExecutorService;
	var $pusher;
	var $levelManager;
	var $fileSystem;
	var $notificationsService;
	var $user_stats;

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $commandExecutorService, $pusher, $levelManager,$fileSystem, $notificationsService, $user_stats){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->commandExecutorService = $commandExecutorService;
		$this->pusher = $pusher;
		$this->levelManager = $levelManager;
		$this->fileSystem = $fileSystem;
		$this->notificationsService = $notificationsService;
		$this->user_stats = $user_stats;
	}

	public function convertKey($discussionKey, $user){
	    if(count(explode("_", $discussionKey))==2){
	      $discussionType = "U"; //user
	      $ids = explode("_", $discussionKey);
	      if($ids[0] == $user->getId()){
	        $discussionId = $ids[1];
	      }else{
	        $discussionId = $ids[0];
	      }
	    }else{
	      $discussionType = "S"; // Stream
	      $discussionId = intval($discussionKey);
	    }
	    return Array(
	      "type"=>$discussionType,
	      "id"=>$discussionId
	      );
	  }

	public function sendMessage($senderId, $recieverType, $recieverId,$isApplicationMessage,$applicationMessage,$isSystemMessage, $content, $subjectId=null, $messageData=null){
	    $sender = null;
        $reciever = null;
        if($senderId != null){
            $sender = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($senderId);
        }
        if($isApplicationMessage) {
            $applicationMessage = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($applicationMessage);
        }

        if($recieverType == "S"){
            $reciever = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($recieverId);

	        //Send notification
	        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"messages-auto"));
	        $workspace = $reciever->getWorkspace();
	        $users = $this->getUserFromStream($sender,$reciever);
            $msg = ($sender!=null?"@".$sender->getUsername()." ":"").$content;
	        $this->notificationsService->pushNotification($application, $workspace, $users, null, null, $msg, Array("push"));
            if($sender!=null){ // select only user message and not system or application message without user
                $this->user_stats->sendMessage($sender, false);
            }
	        //End send notification

        }
        elseif($recieverType == "U"){
            $reciever = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($recieverId);
            //Send notification
            $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"messages-auto"));
            $msg = ($sender!=null?"@".$sender->getUsername()." ":"").$content;
            $this->notificationsService->pushNotificationAsync($application, null, Array($reciever), null, null, $msg, Array("push"));
        }
        if( ($isApplicationMessage || $isSystemMessage|| $sender!=null) && $reciever!=null ){
            $subject = null;
            if($subjectId != null){
                $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subjectId);
            }
            $t = microtime(true);
            $micro = sprintf("%06d",($t - floor($t)) * 1000000);
            $dateTime = new \DateTime( date('Y-m-d H:i:s.'.$micro, $t) );
            $message = new Message($sender, $recieverType, $reciever,$isApplicationMessage ,$applicationMessage,$isSystemMessage, $dateTime ,$content,$this->string_cleaner->simplifyWithoutRemovingSpaces($content),$subject);
            if($messageData!=null){
                $message->setApplicationData($messageData);
            }
            $this->doctrine->persist($message);
            $this->doctrine->flush();

            return $message;

        }
        else{
        }
    }
    public function sendMessageWithFile($senderId, $recieverType, $recieverId,$content, $subjectId=null,$fileId){
	    $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->find($fileId);
        $driveApplication = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"drive"));
        if($file!=null && $driveApplication!=null){
            $messageData = Array("file" => $file->getId());
	        return $this->sendMessage($senderId,$recieverType,$recieverId,true,$driveApplication,false,$content,$subjectId,$messageData);
        }
        return false;
    }



    public function editMessage($id,$content){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if($message != null) {
            $message->setContent($content);
            $message->setEdited(true);
            $this->doctrine->persist($message);
            $this->doctrine->flush();
            return $this->getMessageAsArray($message,false,$message->getResponseTo()!=null);
        }
        return false;
    }

    public function getMessages($recieverType,$recieverId,$maxId,$subjectId,$user){
        $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findWithOffsetId($recieverType,$recieverId,intval($maxId),$subjectId,$user->getId());
        $messages = array_reverse($messages);
        $retour = [];
        foreach($messages as $message){
            $messageArray = $this->getMessageAsArray($message,$subjectId != null);
            if($messageArray){
                $retour[] = $messageArray;
            }
        }
        return $retour;
   }

    public function pinMessage($id,$pinned){

	    if($id == null){
	        return false;
        }
        if($pinned == null){
	        $pinned = false;
        }
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
	    if($message == null){
	        return false;
        }
        $message->setPinned($pinned);
	    $this->doctrine->persist($message);
	    $this->doctrine->flush();
	    return $this->getMessageAsArray($message,true,false);
    }



    public function isAllowed($user,$discussionKey){
        $ids = explode("_", $discussionKey);
        if(count($ids)==1){
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($discussionKey);
            if($stream){
                $workspace = $stream->getWorkspace();
                if($workspace != null){
                    $linkWs = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace"=>$workspace,"user"=>$user));
                    if($linkWs!= null){
                        if($stream != null){
                            if(!$stream->getIsPrivate()){
                                return true;
                            }
                            $link = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("user"=>$user,"stream"=>$stream));
                            if($link != null){
                                return true;
                            }
                        }
                    }
                }

            }
        }
        if(count($ids)==2){
            if($ids[0]==$user->getId() || $ids[1]==$user->getId()){
                return true;
            }
        }
        return false;
    }

    public function moveMessageInSubject($idSubject,$idMessage){
        if($idSubject!=null && $idMessage!=null){
            $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($idSubject);
            $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idMessage);
            if($subject!=null && $message!=null){
                $message->setSubject($subject);
                $this->doctrine->persist($message);
                $this->doctrine->flush();
                return $message->getAsArray();
            }
        }
        return false;
    }


    public function searchMessage($type,$idDiscussion,$content,$from,$dateStart,$dateEnd,$application){
    	if($idDiscussion == null || $type == null){
    		return false;
    	}
    	if($type == "S"){
	    	$stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($idDiscussion);
	    	if($stream == null){
	    		return false;
	    	}
	    	$messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findMessageBy(Array(
	    		"idDiscussion" => $idDiscussion,
	    		"content" => $content,
	    		"from" => $from,
	    		"dateStart" => $dateStart,
	    		"dateEnd" => $dateEnd,
                "application" => $application
	    	));
	    	return $messages;
    	}
    	else if($type == "S"){
            $otherUser = $this->doctrine->getRepository("TwakeDiscussionBundle:User")->find($idDiscussion);
            if($otherUser == null){
                return false;
            }
            $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findMessageBy(Array(
                "idUser" => $idDiscussion,
                "content" => $content,
                "from" => $from,
                "dateStart" => $dateStart,
                "dateEnd" => $dateEnd,
                "application" => $application
            ));
            return $messages;
        }
        else{
    	    return false;
        }

    }


    public function moveMessageInMessage($idDrop,$idDragged){
	    $messageDragged = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDragged);
        $messageDrop = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDrop);
	    if($messageDrop == null || $messageDragged == null){
	        return false;
        }
        $from = $messageDragged->getResponseTo();

        $messageDragged->setResponseTo($messageDrop);
        $this->doctrine->persist($messageDragged);
        $this->setResponseMessage($messageDragged,$messageDrop);
        $this->doctrine->flush();
        if($from != null){
            $from = $this->getMessageAsArray($from);
        }
        $retour = Array(
            "messageDrop" => $this->getMessageAsArray($messageDrop),
            "idDragged" => $idDragged,
            "from" => $from,
        );
        return $retour;
	}

    public function moveMessageOutMessage($idDragged){
        $messageDragged = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDragged);
        if($messageDragged == null )
            return false;
        $oldMessage = $messageDragged->getResponseTo();
        if( $oldMessage == null){
            return false;
        }
        $messageDragged->setResponseTo(null);
        $this->doctrine->persist($messageDragged);
        $this->doctrine->flush();
        if($messageDragged)
        $message["oldMessage"] = $this->getMessageAsArray($oldMessage);
        $message["messageDrag"] = $this->getMessageAsArray($messageDragged);
        return $message;
    }


    private function setResponseMessage($messageParent,$messageDroped){
	    $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo"=>$messageParent));
	    foreach($messages as $message){
	        $message->setResponseTo($messageDroped);
	        $this->doctrine->persist($message);
            $this->setResponseMessage($message,$messageDroped);
        }
    }

    /*  isInSubject : if we want only sumup subject or not
        isResponse : want to return response
    */
    public function getMessageAsArray($message,$isInSubject=false,$isResponse=false){
	    if($message->getResponseTo()!=null){
	        if(!$isResponse){
                return false;
            }
            else{
	            return $this->getMessageAsArray($message->getResponseTo());
            }
        }
        $retour = false;
        if($message->getSubject() != null){
            if($isInSubject){
                $retour = $message->getAsArray();
            }
            else{
                $firstMessage = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("subject" => $message->getSubject()), Array("date" => "ASC"));
                if ($firstMessage == $message) { // it's the first message of this subject
                    $messageInSubject = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("subject" => $message->getSubject()), Array("date" => "DESC"));
                    $nb = count($messageInSubject);
                    $lastMessage = $messageInSubject[0];
                    $retour = $message->getAsArray();
                    $retour["isSubject"] = true;
                    $retour["subject"]["responseNumber"] = $nb;
                    $retour["subject"]["lastMessage"] = $lastMessage->getAsArray();
                }
            }
        }
        else{
            $retour = $message->getAsArray();
        }
        if($retour){
            $responses = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo"=>$message),Array("date" => "ASC"));
            foreach($responses as $response){
                $retour["responses"][] = $response->getAsArray();
            }
        }
        return $retour;
    }

    public function searchDriveMessage($discussionKey,$user){
        $discussionInfos = $this->convertKey($discussionKey, $user);
        $driveApp = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"drive"));
        $messages = null;
        if($driveApp != null){
            $messages = $this->searchMessage($discussionInfos["type"],$discussionInfos["id"],"",null,null,null,$driveApp);
            $retour = [];
            foreach ($messages as $message){
                $mess = $message->getAsArray();
                $mess["file"] = $this->fileSystem->getInfos($message->getApplicationData()["file"]);
                $retour[] = $mess;
            }
        }
        return $retour;
    }

    public function getUserFromStream($user,$stream){
        $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($stream);
        $retour = [];
        if($stream->getIsPrivate()){
            foreach($stream->getMembersLinks() as $link){
                if($link->getUser() != $user){
                    $retour[] = $link->getUser();
                }
            }
        }
        else{
            $links = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("workspace"=>$stream->getWorkspace()));
            foreach($links as $link){
                $retour[] = $link->getUser();
            }
        }
        return $retour;
    }

    public function notify($discussionKey,$type,$message){
        $data = Array(
            "type" => $type,
            "data" => $message->getAsArray(),
        );
        $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionKey));
    }



}
