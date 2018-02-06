<?php

namespace WebsiteApi\DiscussionBundle\Model;

interface MessagesSystemInterface
{
    /**
     * Create message to send
     * @param $senderId
     * @param $recieverType
     * @param $recieverId
     * @param $isApplicationMessage
     * @param $applicationMessage
     * @param $isSystemMessage
     * @param $content
     * @param null $subjectId
     * @return mixed
     */
    public function sendMessage($senderId, $recieverType, $recieverId,$isApplicationMessage,$applicationMessage,$isSystemMessage, $content, $subjectId=null );


    /**
     * edit message
     * @param $id
     * @param $content
     * @return mixed
     */
    public function editMessage($id,$content);

    /**
     * get list of messages
     * @param $user
     * @param $recieverType
     * @param $recieverId
     * @param $offset
     * @param $subjectId
     * @return mixed
     */
    public function getMessages($user,$recieverType,$recieverId,$offset,$subjectId);


    /**
     * pin message
     * @param $id
     * @param $pinned
     * @return mixed
     */
    public function pinMessage($id,$pinned);

    /**
     * ask if user is allowed to do some action
     * @param $sender
     * @param $recieverType
     * @param $recieverId
     * @return mixed
     */
    public function isAllowed($user,$discussionKey);

    /**
     * search message with param
     * @param $type
     * @param $idDiscussion
     * @param $content
     * @param $from
     * @param $dateStart
     * @param $dateEnd
     * @return mixed
     */
    public function searchMessage($type,$idDiscussion,$content,$from,$dateStart,$dateEnd,$application);


    /**
     * drop message in other message to response
     * @param $idDrop
     * @param $idDragged
     * @return mixed
     */
    public function moveMessageInMessage($idDrop,$idDragged);

    /**
     * get lists of message as array. Sort message by response, subject etc..
     * @param $message
     * @return mixed
     */
    public function getMessageAsArray($message);

    /**
     * notify changement of message on discussion
     * @param $discussionKey
     * @param $type
     * @param $message
     * @return mixed
     */
    public function notify($discussionKey,$type,$message);

}