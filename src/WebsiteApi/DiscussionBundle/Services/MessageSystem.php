<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\MarketBundle\Entity\Application;
use WebsiteApi\UsersBundle\Services\Notifications;
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
	var $notifications;
	var $commandExecutorService;
	var $notificationsService;
	var $pusher;
	var $levelManager;

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker,Notifications $notifications, $commandExecutorService, $notificationsService, $pusher, $levelManager){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->notifications = $notifications;
		$this->commandExecutorService = $commandExecutorService;
		$this->notificationsService = $notificationsService;
		$this->pusher = $pusher;
		$this->levelManager = $levelManager;
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

	public function sendMessage($senderId, $recieverType, $recieverId,$isApplicationMessage,$applicationMessage,$isSystemMessage, $content, $subjectId=null ){
	    error_log("send message senderId:".$senderId.", recieverType:".$recieverType.", recieverId:".$recieverId);
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
        }
        elseif($recieverType == "U"){
            $reciever = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($recieverId);
        }
        if( ($isApplicationMessage || $isSystemMessage|| $sender!=null) && $reciever!=null ){
            $subject = null;
            if($subjectId != null){
                $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subjectId);
            }
            $message = new Message($sender, $recieverType, $reciever,$isApplicationMessage ,$applicationMessage,$isSystemMessage, new \DateTime() ,$content,$this->string_cleaner->simplifyWithoutRemovingSpaces($content),$subject);
            $this->doctrine->persist($message);
            $this->doctrine->flush();
            return $message;

        }
        else{
            error_log("not send");
        }
    }

    public function editMessage($id,$content){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if($message != null) {
            $message->setContent($content);
            $message->setEdited(true);
            $this->doctrine->persist($message);
            $this->doctrine->flush();
            return $message;
        }
        return false;
    }

    public function getMessages($user,$recieverType,$recieverId,$offset,$subjectId){
	    error_log("get message, reciever type".$recieverType.", revcieverId:".$recieverId);
	    if($recieverType == "S"){
	        $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($recieverId);
	        if($stream != null){
	            if(isset($subjectId) && $subjectId!=null ){
                    $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subjectId);
                }
                else{
	                $subject = null;
                }
	            $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("typeReciever" => "S", "streamReciever" => $stream),Array("date"=>"DESC"), $limit = 30, $offset = $offset);
                $messages = array_reverse($messages);
                $retour = [];
                foreach($messages as $message){
                    $messageArray = $this->getMessageAsArray($message);
                    if($messageArray){
                        $retour[] = $messageArray;
                    }
                }
                return $retour;
            }
        }
        elseif($recieverType == "U"){
            $otherUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($recieverId);
            if($otherUser != null){
                $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("userSender" => $otherUser,"userReciever"=>$user),Array("date"=>"DESC"), $limit = $offset, $offset = 0);
                $messages = array_merge($messages,$this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("userSender" => $user,"userReciever"=>$otherUser),Array("date"=>"DESC"), $limit = 30, $offset = $offset));
                $messages = array_reverse($messages);
;               $retour = [];
                foreach($messages as $message){
                    $retour[] = $this->getMessageAsArray($message);
                }
                return $retour;
            }
        }
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
	    return $message;
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
                            if(!$stream->getPrivacy()){
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


    public function getMessageAsArray($message){
	    if($message->getResponseTo()!=null){
	        error_log("isResponse ".$message->getId());
	        return false;
        }
        $retour = false;
        if($message->getSubject() != null){
            $firstMessage = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("subject" => $message->getSubject()), Array("date" => "ASC"));
            if ($firstMessage == $message) { // it's the first message of this subject
                $messageInSubject = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("subject" => $message->getSubject()), Array("date" => "DESC"));
                $nb = count($messageInSubject);
                $lastMessage = $messageInSubject[0];
                if ($lastMessage != $firstMessage) {
                    $retour = array_merge($message->getAsArray(), Array("isSubject" => true,"responseNumber" => $nb, "lastMessage" => $lastMessage->getAsArray()));
                } else {
                    $retour = array_merge($message->getAsArray(), Array("isSubject" => true, "responseNumber" => $nb));
                }
            }
            else{
             }
        }
        else{
            $retour = $message->getAsArray();
        }
        $responses = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo"=>$message),Array("date" => "ASC"));
        foreach($responses as $response){
            $retour["responses"][] = $response->getAsArray();
        }
        return $retour;
    }

    public function searchDriveMessage($discussionKey,$user){
        $discussionInfos = $this->convertKey($discussionKey, $user);
        $driveApp = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"drive"));
        $messages = null;
        if($driveApp != null){
            $messages = $this->searchMessage($discussionInfos["type"],$discussionInfos["id"],"",null,null,null,$driveApp);
        }
        return $messages;
    }


    public function notify($discussionKey,$type,$message){
        $data = Array(
            "type" => $type,
            "data" => $message->getAsArray(),
        );
        $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionKey));
    }


}
