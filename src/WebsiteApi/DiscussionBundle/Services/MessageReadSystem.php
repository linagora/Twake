<?php

namespace WebsiteApi\DiscussionBundle\Services;

use WebsiteApi\DiscussionBundle\Entity\MessageRead;


class MessageReadSystem
{

    var $doctrine;
    var $messageSystem;
    var $notificationSystem;

    function __construct($doctrine,$messageSystem,$notificationSystem){
        $this->doctrine = $doctrine;
        $this->messageSystem= $messageSystem;
        $this->notificationSystem= $notificationSystem;
    }

    function readByKey($key,$user){
        $discussion = $this->messageSystem->convertKey($key,$user);
        $messageApplication = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"messages-auto"));
        if($discussion["type"] == "S"){
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($discussion["id"]);
            if($stream == null){
                error_log("Stream Not found");
                return false;
            }
            $messageRead = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageRead")->findOneBy(Array("user"=>$user,"stream"=>$stream));
            $lastMessages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->getMessageNotOwner($user->getId(),$stream->getId(),1);
            if($lastMessages!=null){
                $lastMessage = $lastMessages[0];
                error_log("lasMessage ".$lastMessage->getId()." for stream ".$lastMessage->getStreamReciever()->getId().", asked ".$stream->getId());
                if($messageRead == null){
                    $messageRead = new MessageRead();
                    $messageRead->setUser($user);
                    $messageRead->setStream($stream);
                }
                $messageRead->setMessage($lastMessage);
                $this->doctrine->persist($messageRead);
                $this->doctrine->flush();
                if($this->allIsRead($stream->getWorkspace(),$user)){
                    $this->notificationSystem->readAll($messageApplication,$stream->getWorkspace(),$user,null);
                }
                return true;
            }
            else{
                error_log("last Message not found");
            }
        }
        else {
            $otherUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussion["id"]);
            if ($otherUser == null) {
                return false;
            }
            $messageRead = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageRead")->findOneBy(Array("user" => $user, "otherUser" => $otherUser));
            $lastMessage = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("userSender"=>$otherUser));
            if ($lastMessage == null) {
                return true;
            }
            if($messageRead == null){
                $messageRead = new MessageRead();
                $messageRead->setUser($user);
                $messageRead->setOtherUser($otherUser);
            }
            $messageRead->setMessage($lastMessage);
            $this->doctrine->persist($messageRead);
            $this->doctrine->flush();
            return true;
        }
        return false;
    }



    function streamIsReadByKey($key,$user){
        $discussion = $this->messageSystem->convertKey($key,$user);

        if($discussion["type"] == "S"){
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($discussion["id"]);
            if($stream ==null){
                return false;
            }
            $messageRead = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageRead")->findOneBy(Array("user"=>$user,"stream"=>$stream));
            $lastMessages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->getMessageNotOwner($user->getId(),$stream->getId(),1);

            if($lastMessages==null){ //no message in this stream
                return true;
            }
            $lastMessage = $lastMessages[0];
            error_log("lastMessageFound ".$lastMessage->getId());
            if($messageRead == null){
                return false;
            }
            if($lastMessage == $messageRead->getMessage()){
                return true;
            }
            error_log("messageRed : ".$messageRead->getMessage()->getId());
            return false;
        }else{
            $otherUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussion["id"]);
            if($otherUser == null){
                error_log("other user not found".$discussion["id"] );
                return false;
            }
            $messageRead = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageRead")->findOneBy(Array("user"=>$user,"otherUser"=>$otherUser));
            $lastMessage = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("userSender"=>$otherUser));

            if ($lastMessage == null) {
                return true;
            }
            if ($messageRead == null) {
                return false;
            }
            if ($lastMessage == $messageRead->getMessage()) {
                return true;
            }
            return false;
        }
    }

    public function allIsRead($workspace,$user){
        if($workspace != null && $user != null){
            $streams = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->findBy(Array("workspace"=>$workspace));
            foreach($streams as $stream){
                if(!$this->streamIsReadByKey($stream->getId(),$user)){
                    error_log("find activities in ".$stream->getId());
                    return false;
                }
            }
            $links = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findBy(Array("workspace"=>$workspace));
            foreach($links as $link){
                if($link->getUser() != $user){
                    if(!$this->streamIsReadByKey($link->getUser()->getId()."_".$user->getId(),$user)){
                        error_log("find activities with ".$link->getUser()->getId());
                        return false;
                    }
                }
            }
        }
        return true;
    }

}