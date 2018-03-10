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

    function readByKey($key,$workspace,$user){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        $discussion = $this->messageSystem->convertKey($key,$user);
        $messageApplication = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url"=>"messages-auto"));
        if($discussion["type"] == "S"){
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($discussion["id"]);
            if($stream == null){
                return false;
            }
            $messageRead = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageRead")->findOneBy(Array("user"=>$user,"stream"=>$stream));
            $lastMessages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->getMessageNotOwner($user->getId(),$stream->getId(),1);
            if($lastMessages!=null){
                $lastMessage = $lastMessages[0];
                if($messageRead == null){
                    error_log("message read null");
                    $messageRead = new MessageRead();
                    $messageRead->setUser($user);
                    $messageRead->setStream($stream);
                }
                error_log("message read : ".$messageRead->getId());
                error_log("last message : ".$lastMessage->getId());
                $messageRead->setMessage($lastMessage);
                $this->doctrine->persist($messageRead);
                $this->doctrine->flush();
                if($this->allIsRead($workspace,$user)){
                    error_log("all read");
                    $this->notificationSystem->readAll($messageApplication,$workspace,$user,null);
                }
                else{
                    error_log("not all read");
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
            if($this->allIsRead($workspace,$user)){
                error_log("all read");
                $this->notificationSystem->readAll($messageApplication,$workspace,$user,null);
            }
            return true;
        }
        $this->doctrine->flush();
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
            if($messageRead == null){
                return false;
            }
            if($lastMessage == $messageRead->getMessage()){
                return true;
            }
            return false;
        }else{
            $otherUser = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($discussion["id"]);
            if($otherUser == null){
                return false;
            }
            $messageRead = $this->doctrine->getRepository("TwakeDiscussionBundle:MessageRead")->findOneBy(Array("user"=>$user,"otherUser"=>$otherUser));
            $lastMessage = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("userSender"=>$otherUser,"userReciever"=>$user),Array("date"=>"DESC"));

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
                if(!$stream->getIsPrivate() || $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")->findOneBy(Array("stream"=>$stream,"user"=>$user))!=null)
                {
                    if(!$this->streamIsReadByKey($stream->getId(),$user)){
                        error_log("find activities in ".$stream->getId());
                        return false;
                    }
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