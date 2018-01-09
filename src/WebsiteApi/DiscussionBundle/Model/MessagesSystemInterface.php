<?php
/**
 * Created by PhpStorm.
 * User: benoit
 * Date: 23/12/17
 * Time: 22:54
 */


interface MessagesSystemInterface
{
    /**
     * Verify that the user is allowed to send messages in this discussion
     */
    function isAllowed(User $user, $discussionType, $discussionId);

    function isAllowedByKey(User $user, $discussionKey);

    /**
     * Convertie une discussionKey en un array contenant le discussion type et le discussion ID
     * @param $discussionKey
     * @return array
     */
    function convertKey($discussionKey, $user);



    /**
     * Like a message and send modifications to users
     */
    function likeMessage($user, $discussionType, $discussionId, $messageId, $type, $topic = null);


    /**
     * Edit a message and send modifications to users
     */
    function editMessage($user, $discussionType, $discussionId, $messageId, $content, $topic = null);

    /**
     * Pin a message and send modifications to users
     */
    function pinMessage($user, $discussionType, $discussionId, $messageId, $pinned, $topic = null);

    /**
     * Delete a message using message id (verify that it's our message)
     */
    function deleteMessage($user, $discussionType, $discussionId, $messageId, $topic = null);

    /**
     * Get lasts messages and info about users of the discussion
     */
    function getInit($user, $discussionType, $discussionId, $topic = null);

    /**
     * Get older messages in a discussion
     */
    function getOlder($user, $discussionKey, $oldest);


    /**
     * Send a message to a discussion
     */
    function sendMessage($user, $discussionType, $discussionId, $content, $topic = null);


    function sendMessageUpload($user, $discussionType, $discussionId, $idFile, $fileIsInDrive, $topic = null);

    function removeFileFromDrive($fileId);

    /**
     * Get a discussion members
     */
    function getMembers($user, $discussionType, $discussionId);

    function enterCall($user, $discussionKey);



}