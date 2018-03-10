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
	var $workspace_stats;

	function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $commandExecutorService, $pusher, $levelManager,$fileSystem, $notificationsService, $user_stats, $workspace_stats){
		$this->string_cleaner = $string_cleaner;
		$this->doctrine = $doctrine;
		$this->security = $authorizationChecker;
		$this->commandExecutorService = $commandExecutorService;
		$this->pusher = $pusher;
		$this->levelManager = $levelManager;
		$this->fileSystem = $fileSystem;
		$this->notificationsService = $notificationsService;
		$this->user_stats = $user_stats;
		$this->workspace_stats = $workspace_stats;
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

	public function sendMessage($senderId, $recieverType, $recieverId,$isApplicationMessage,$applicationMessage,$isSystemMessage, $content,$workspace, $subjectId=null, $messageData=null){
	    $sender = null;
        $reciever = null;
        if($workspace!=null){
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }
        if($senderId != null){
            $sender = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($senderId);
        }
        if($isApplicationMessage) {
            $applicationMessage = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($applicationMessage);
        }
        $key = ($recieverType == "S"?$recieverId:$senderId."_".$recieverId);
        if(!$isApplicationMessage && !$isSystemMessage && !$this->isAllowed($sender,$key)){
            return false;
        }
        if($recieverType == "S"){
            $reciever = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($recieverId);

            if($sender!=null && $reciever!=null){ // select only user message and not system or application message without user
                $this->user_stats->sendMessage($sender, false);
                if($workspace!=null) {
                    $this->workspace_stats->sendMessage($workspace, false, $reciever->getIsPrivate());
                }
            }
        }
        elseif($recieverType == "U"){
            $reciever = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($recieverId);
	        if($sender!=null){ // select only user message and not system or application message without user
		        $this->user_stats->sendMessage($sender, true);
                if($workspace!=null){
                    $this->workspace_stats->sendMessage($workspace, false, true);
                }
            }
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
            $this->sendNotification($message,$workspace);
            return $message;

        }
        else{
        }
    }
    public function sendMessageWithFile($senderId, $recieverType, $recieverId,$content,$workspace, $subjectId=null,$fileId){
	    $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->find($fileId);
        $driveApplication = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"drive"));
        $sender = null;
        if($senderId!=null){
            $sender = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($senderId);
        }
        if($file!=null && $driveApplication!=null){
            $messageData = Array("file" => $file->getId());
	        return $this->sendMessage($senderId,$recieverType,$recieverId,true,$driveApplication,false,$content,$workspace,$subjectId,$messageData);
        }
        return false;
    }



    public function editMessage($id,$content,$user){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if(!$this->isAllowed($user,$message->getDiscussionKey()) || $message->getUserSender()!=$user){
            return false;
        }
        if($message != null) {
            $message->setContent($content);
            $message->setEdited(true);
            $this->doctrine->persist($message);
            $this->doctrine->flush();
            return $this->getMessageAsArray($message,false,$message->getResponseTo()!=null);
        }
        return false;
    }

    public function deleteMessage($id,$user){
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if(!$this->isAllowed($user,$message->getDiscussionKey()) || $message->getUserSender()!=$user){
            return false;
        }
        if($message != null) {
            if($message->getResponseTo()!=null){
                $messageParent = $message->getResponseTo();
                $this->doctrine->remove($message);
                $this->doctrine->flush();
                $messageArray = $this->getMessageAsArray($messageParent);
            }
            else{
                $responses = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo"=>$message));
                foreach ($responses as $response){
                    $this->doctrine->remove($response);
                }
                $messageArray = $message->getAsArray();
                $this->doctrine->remove($message);
                $this->doctrine->flush();
            }
            return $messageArray ;
        }
        return false;
    }

    public function getMessages($recieverType,$recieverId,$maxId,$subjectId,$user){
	    $key = ($recieverType == "S"?$recieverId:$user->getId()."_".$recieverId);
        if(!$this->isAllowed($user,$key)){

            return false;
        }
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

    public function pinMessage($id,$pinned,$user){
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
        if(!$this->isAllowed($user,$message->getDiscussionKey())){
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
            if($stream != null){
                $workspace = $stream->getWorkspace();
                if($workspace != null){
                    $linkWs = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace"=>$workspace,"user"=>$user));
                    if($linkWs!= null){
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
        if(count($ids)==2){
            if($ids[0]==$user->getId() || $ids[1]==$user->getId()){
                return true;
            }
        }
        return false;
    }

    public function moveMessageInSubject($idSubject,$idMessage,$user){
        if($idSubject!=null && $idMessage!=null){
            $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($idSubject);
            $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idMessage);
            if(!$this->isAllowed($user,$message->getDiscussionKey())){
                return false;
            }
            if($subject!=null && $message!=null){
                $message->setSubject($subject);
                $this->doctrine->persist($message);
                $this->doctrine->flush();
                return $message->getAsArray();
            }
        }
        return false;
    }


    public function searchMessage($type,$idDiscussion,$content,$from,$dateStart,$dateEnd,$application,$user){
    	if($idDiscussion == null || $type == null){
    		return false;
    	}
    	if($type == "S"){
	    	$stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($idDiscussion);
	    	if($stream == null){
	    		return false;
	    	}
            if(!$this->isAllowed($user,$stream->getId())){
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
    	else if($type == "U"){
            $otherUser = $this->doctrine->getRepository("TwakeDiscussionBundle:User")->find($idDiscussion);
            if($otherUser == null){
                return false;
            }
            if(!$this->isAllowed($user,$user->getId()."_".$otherUser->getId())){
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


    public function moveMessageInMessage($idDrop,$idDragged,$user){
	    $messageDragged = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDragged);
        $messageDrop = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDrop);
	    if($messageDrop == null || $messageDragged == null){
	        return false;
        }
        if(!$this->isAllowed($user,$messageDrop->getDiscussionKey())){
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
        $messageDropArray = $this->getMessageAsArray($messageDrop,$messageDrop->getSubject()!=null);
        $retour = Array(
            "messageDrop" => $messageDropArray,
            "idDragged" => $idDragged,
            "from" => $from,
        );
        return $retour;
	}

    public function moveMessageOutMessage($idDragged,$user){
        $messageDragged = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDragged);
        if($messageDragged == null ){
            return false;
        }
        if(!$this->isAllowed($user,$messageDragged->getDiscussionKey())){
            return false;
        }

        $oldMessage = $messageDragged->getResponseTo();
        if( $oldMessage == null){
            return false;
        }
        $messageDragged->setResponseTo(null);
        $this->doctrine->persist($messageDragged);
        $this->doctrine->flush();

        $oldMessageArray = $this->getMessageAsArray($oldMessage,$oldMessage->getSubject()!=null);
        $messageDraggedArray = $this->getMessageAsArray($messageDragged,$messageDragged->getSubject()!=null);

        $message["oldMessage"] = $oldMessageArray;
        $message["messageDrag"] = $messageDraggedArray;
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
        if(!$this->isAllowed($user,$discussionKey)){
            return false;
        }
        $driveApp = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"drive"));
        $messages = null;
        if($driveApp != null){
            $messages = $this->searchMessage($discussionInfos["type"],$discussionInfos["id"],"",null,null,null,$driveApp,$user);
            $retour = [];
            foreach ($messages as $message){
                $mess = $message->getAsArray();
                $mess["file"] = $this->fileSystem->getInfos($message->getApplicationData()["file"]);
                $retour[] = $mess;
            }
        }
        return $retour;
    }

    private function getUserFromStream($user,$stream){
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
                if($link->getUser() != $user) {
                    $retour[] = $link->getUser();
                }
            }
        }
        return $retour;
    }

    public function sendNotification($message,$workspace){
        $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"messages-auto"));
        if($message->getTypeReciever() == "S"){
            if($message->getIsSystemMessage()){
                return;
            }
            elseif($message->getIsApplicationMessage()){
                $users = $this->getUserFromStream(null,$message->getStreamReciever());
                $msg = "#".$message->getStreamReciever()->getName();
            }
            else{
                $users = $this->getUserFromStream($message->getUserSender(),$message->getStreamReciever());
                $msg = "#".$message->getStreamReciever()->getName()." : @".$message->getUserSender()->getUsername()." ".$message->getCleanContent();
            }
        }
        else{
            $users = Array($message->getUserReciever());
            $msg = "@".$message->getUserSender()->getUsername()." : ".$message->getContent();
        }
        error_log($msg);
        $this->notificationsService->pushNotification($application, $workspace, $users, null, null, $msg, Array("push"));
    }

    public function notify($discussionKey,$type,$messageArray){
        $data = Array(
            "type" => $type,
            "data" => $messageArray,
        );
        $this->pusher->push($data, "discussion_topic",Array("key"=>$discussionKey));
    }



}
