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
    public function sendMessage($senderId, $recieverType, $recieverId,$isApplicationMessage,$applicationMessage,$isSystemMessage, $content,$workspace, $subjectId=null );


    /**
     * edit message
     * @param $id
     * @param $content
     * @param $user
     * @return mixed
     */
    public function editMessage($id,$content,$user);

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
     * @param $user
     * @return mixed
     */
    public function pinMessage($id,$pinned,$user);

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
     * @param $user
     * @return mixed
     */
    public function searchMessage($type,$idDiscussion,$content,$from,$dateStart,$dateEnd,$application,$user);

    /**
     * @param $discussionKey
     * @param $user
     * @return mixed
     */
    public function searchDriveMessage($discussionKey,$user);

    /**
     * drop message in other message to response
     * @param $idDrop
     * @param $idDragged
     * @param $user
     * @return mixed
     */
    public function moveMessageInMessage($idDrop,$idDragged,$user);

    /**
     * @param $idDragged
     * @param $user
     * @return mixed
     */
    public function moveMessageOutMessage($idDragged,$user);

    /**
     * @param $idSubject
     * @param $idMessage
     * @param $user
     * @return mixed
     */
    public function moveMessageInSubject($idSubject,$idMessage,$user);
    /**
     * @param $id
     * @param $user
     * @return mixed
     */
    public function deleteMessage($id,$user);

    /**
     * get lists of message as array. Sort message by response, subject etc..
     * @param $message
     * @return mixed
     */
    public function getMessageAsArray($message,$isSubject=false,$isResponse=false);

    /**
     * notify changement of message on discussion
     * @param $discussionKey
     * @param $type
     * @param $message
     * @return mixed
     */
    public function notify($discussionKey,$type,$message);

}