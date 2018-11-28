<?php


namespace WebsiteApi\DiscussionBundle\Services;

use Symfony\Component\HttpFoundation\JsonResponse;
use WebsiteApi\DiscussionBundle\Entity\Call;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\CoreBundle\Services\StringCleaner;
use WebsiteApi\DiscussionBundle\Entity\MessageLike;
use WebsiteApi\DiscussionBundle\Entity\Stream;
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
    var $fileSystemAdapter;
    var $messagesNotificationCenter;

    function __construct(StringCleaner $string_cleaner, $doctrine, AuthorizationChecker $authorizationChecker, $commandExecutorService, $pusher, $levelManager, $fileSystemAdapter, $messagesNotificationCenter)
    {
        $this->string_cleaner = $string_cleaner;
        $this->doctrine = $doctrine;
        $this->security = $authorizationChecker;
        $this->commandExecutorService = $commandExecutorService;
        $this->pusher = $pusher;
        $this->levelManager = $levelManager;
        $this->fileSystemAdapter = $fileSystemAdapter;
        $this->messagesNotificationCenter = $messagesNotificationCenter;
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = $var; // Cassandra id do nothing
        }

        if (is_int($var) || is_string($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }


    public function getStream($streamKey, $currentUserId = null)
    {
        $explode = explode("-", $streamKey);

        $streamObject = Array(
            "type" => null,
            "object" => null,
            "key" => null
        );

        if ($explode[0] == "s") {

            $s = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find(intval($explode[1]));
            if (!$s) {
                return null;
            }
            $streamObject["type"] = $s->getType();
            $streamObject["object"] = $s;
            $streamObject["key"] = "s-" . intval($explode[1]);

            return $streamObject;

        } else if ($explode[0] == "u" && $currentUserId) {
            $users = explode("_", $explode[1]);
            $key = min($users[0], $users[1]) . "_" . max($users[0], $users[1]);

            $s = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")
                ->findOneBy(Array("key" => $key, "type" => "user"));

            if (!$s) {
                //create channel between two users
                $s = new Stream(null, "", false, "");
                $s->setType("user");
                $s->setKey($key);
                $this->doctrine->persist($s);

                $users1 = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($users[0]);
                $users2 = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($users[1]);
                $l1 = $s->addMember($users1);
                $l2 = $s->addMember($users2);
                $this->doctrine->persist($l1);
                $this->doctrine->persist($l2);

                $this->doctrine->flush();

            }

            $streamObject["type"] = "user";
            $streamObject["object"] = $s;
            $streamObject["key"] = "u-" . $key;

            return $streamObject;

        } else if ($explode[0] == "p") {
            $data = explode("_", $explode[1]);
            $key = $data[1];
            $id = $data[0];
            $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find(intval($id));
            if ($stream && $stream->getType() == "public" && $stream->getKey() == $key) {
                $streamObject["type"] = "public";
                $streamObject["object"] = $stream;
                $streamObject["key"] = "p-" . $explode[1];

                return $streamObject;
            }
            return null;
        }
        return null;
    }

    public function convertKey($discussionKey, $user = null)
    {
        $stream_obj = $this->getStream($discussionKey, $user ? $user->getId() : null);
        if (!$stream_obj) {
            return false;
        }
        $discussionId = $stream_obj["object"]->getId();
        $discussionType = "S";
        return Array(
            "type" => $discussionType,
            "id" => $discussionId
        );
    }


    public function isInPrivate($streamObject, $currentUser)
    {
        if (!$streamObject || $streamObject["type"] != "stream") {
            return false;
        }
        $present = $this->doctrine->getRepository("TwakeDiscussionBundle:StreamMember")
            ->findOneBy(Array("user" => $currentUser, "stream" => $streamObject["object"]));
        if ($present) {
            return true;
        }
        return false;
    }

    public function isAllowed($streamObject, $currentUser, $action = "read")
    {

        if (!$streamObject) {
            return false;
        }

        if ($streamObject["type"] == "user") {
            return true;
        }

        if ($streamObject["type"] == "public") {
            return true;
        }

        if ($streamObject["type"] == "stream" || $streamObject["type"] == "") {

            $workspace = $streamObject["object"]->getWorkspace();
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($currentUser);

            if ($workspace == null || $user == null) {
                return false;
            }
            if ($workspace->getUser() == $user) {
                return true;
            }

            if (!$streamObject["object"]->getIsPrivate()) {

                $can = $this->levelManager->can($workspace, $user, "messages:" . $action);
                if ($can) {
                    return true;
                }

            } else {

                if ($this->isInPrivate($streamObject, $currentUser)) {
                    return true;
                }

            }

        }

        return false;
    }


    public function sendMessage($senderId, $key, $isApplicationMessage, $applicationId, $isSystemMessage, $content, $workspace, $subjectId = null, $messageData = null, $notify = true, $front_id = "", $respond_to = 0)
    {

        if (!$front_id || $front_id == "") {
            $front_id = date("U") . bin2hex(random_bytes(10));
        }

        if ($workspace != null) {
            $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->find($workspace);
        }

        $sender = null;
        if ($senderId != null) {
            $sender = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($senderId);
        }

        $stream_object = $this->getStream($key, $sender ? $sender->getId() : null);

        if (!$stream_object) {
            return false;
        }

        $application = null;
        if ($isApplicationMessage) {
            $application = $this->doctrine->getRepository("TwakeMarketBundle:Application")->find($applicationId);
        }

        $stream = $stream_object["object"];
        if (!$isApplicationMessage && !$isSystemMessage && !$this->isAllowed($stream_object, $sender)) {
            return false;
        }

        if (($isApplicationMessage || $isSystemMessage || $sender != null) && $stream != null) {
            $subject = null;
            if ($subjectId != null) {
                $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($subjectId);
                $subject->setDateUpdate(new \DateTime());
                $this->doctrine->persist($subject);
            }
            $t = microtime(true);
            $micro = sprintf("%06d", ($t - floor($t)) * 1000000);
            $dateTime = new \DateTime(date('Y-m-d H:i:s.' . $micro, $t));
            $message = new Message($sender, "S", $stream, $isApplicationMessage, $application, $isSystemMessage, $dateTime, $content, $this->string_cleaner->simplifyWithoutRemovingSpaces($content), $subject);
            $message->setFrontId($front_id);

            if ($respond_to > 0) {
                $responseTo = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($respond_to);
                if ($responseTo) {
                    $responseTo->setHasResponses(true);
                    $this->doctrine->persist($responseTo);

                    $message->setResponseTo($responseTo);
                }
            }

            if ($messageData != null) {
                $message->setApplicationData($messageData);
            }
            $this->doctrine->persist($message);
            $this->doctrine->flush();

            $this->notify($stream->getId(), "C", $message->getAsArray());

            if ($sender != null) {
                $this->messagesNotificationCenter->read($stream, $sender);
            }

            if ($notify) {
                $this->messagesNotificationCenter->notify($stream, $sender ? Array($sender->getId()) : Array(), $message);
            }

            return $message;

        } else {
            return null;
        }
    }

    public function sendMessageWithFile($senderId, $key, $content, $workspace, $subjectId = null, $fileId, $respond_to = 0)
    {
        if ($senderId == null) {
            return null;
        }

        $file = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->find($fileId);
        $driveApplication = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url" => "drive"));

        if ($file != null && $driveApplication != null) {
            $messageData = Array("file" => $file->getId());
            return $this->sendMessage($senderId, $key, true, $driveApplication, false, $content, $workspace, $subjectId, $messageData, false,"",$respond_to);
        }
        return false;
    }

    public function notifySendMessage($stream, $except, $message_id)
    {
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($message_id);
        $this->messagesNotificationCenter->notify($stream, $except, $message);
    }

    public function readStream($stream, $user)
    {
        $stream = $this->convertToEntity($stream,"TwakeDiscussionBundle:Stream");
        return $this->messagesNotificationCenter->read($stream, $user);
    }

    public function editMessageFromApp($id, $content){
        $message = $this->convertToEntity($id,"TwakeDiscussionBundle:Message");
        return $this->editMessage($id,$content,$message->getUserSender());
    }


    public function editMessage($id, $content, $user)
    {
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if (!$message) {
            return false;
        }

        if ($message->getUserSender()->getId() != $user->getId()) {
            return false;
        }

        if ($message != null) {
            $message->setContent($content);
            $cleanContent = $this->string_cleaner->simplifyWithoutRemovingSpaces($content);
            $message->setCleanContent($cleanContent);
            $message->setEdited(true);
            $this->doctrine->persist($message);
            $this->doctrine->flush();
            return $message->getAsArray();
        }
        return false;
    }

    public function deleteMassageFromApp($id){
        $message = $this->convertToEntity($id,"TwakeDiscussionBundle:Message");
        if($message==null)
            return false;
        return $this->deleteMessage($id,$message->getUserSender());
    }

    public function deleteMessage($id, $user)
    {
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if (!$message) {
            return false;
        }

        if ($message->getUserSender()->getId() != $user->getId()) {
            return false;
        }

        if ($message != null) {

            $array = $message->getAsArray();

            if ($message->getResponseTo() != null) {
                $this->doctrine->remove($message);
                $this->doctrine->flush();
            } else {
                $responses = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo" => $message));
                foreach ($responses as $response) {
                    $this->doctrine->remove($response);
                }
                $this->doctrine->remove($message);
                $this->doctrine->flush();
            }
            return $array;
        }
        return false;
    }

    public function getMessagesFromStream($streamId){
        $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("streamReciever" => $streamId));

        return $messages;
    }

    public function getMessages($key, $maxId, $subjectId, $user, $maxResult=50)
    {

        $stream = $this->getStream($key, $user->getId());
        if (!$this->isAllowed($stream, $user)) {
            return false;
        }

        $this->messagesNotificationCenter->read($stream["object"], $user, true);

        $vals = $this->convertKey($key, $user);
        $recieverId = $vals["id"];
        $recieverType = $vals["type"];

        $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findWithOffsetId($recieverId, $maxId, $subjectId, $maxResult);

        $headIds = [];
        foreach ($messages as $message) {
            if ($message->getHasResponses()) {
                $headIds[] = $message->getId();
            }
        }

        $messages = array_merge($messages, $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findResponsesOf($headIds, $recieverId, $subjectId));

        $retour = [];
        foreach ($messages as $message) {
            $retour[] = $message->getAsArray();
        }
        return $retour;
    }

    public function getMessage($messageId){
        $message = $this->convertToEntity($messageId,"TwakeDiscussionBundle:Message");
        return $message;
    }

    public function pinMessage($id, $pinned, $user)
    {
        if ($id == null) {
            return false;
        }
        if ($pinned == null) {
            $pinned = false;
        }
        $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($id);
        if ($message == null) {
            return false;
        }
        $message->setPinned($pinned);
        $this->doctrine->persist($message);
        $this->doctrine->flush();
        return $message->getAsArray();
    }

    public function moveMessageInSubject($idSubject, $idMessage, $user)
    {
        if ($idSubject != null && $idMessage != null) {
            $subject = $this->doctrine->getRepository("TwakeDiscussionBundle:Subject")->find($idSubject);
            $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idMessage);

            if ($subject != null && $message != null) {
                $message->setSubject($subject);
                $this->doctrine->persist($message);
                $this->doctrine->flush();
                return $message->getAsArray();
            }
        }
        return false;
    }


    public function searchMessage($idDiscussion, $content, $from, $dateStart, $dateEnd, $application, $user)
    {
        if ($idDiscussion == null) {
            return false;
        }
        $stream = $this->doctrine->getRepository("TwakeDiscussionBundle:Stream")->find($idDiscussion);
        if ($stream == null) {
            return false;
        }
        $stream = $this->getStream($stream->getAsArray()["key"], $user->getId());
        if (!$this->isAllowed($stream, $user)) {
            return false;
        }
        $content = $this->string_cleaner->simplifyWithoutRemovingSpaces($content);

        return $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findMessageBy(Array(
            "idDiscussion" => $idDiscussion,
            "content" => $content,
            "from" => $from,
            "dateStart" => $dateStart,
            "dateEnd" => $dateEnd,
            "application" => $application
        ));
    }


    public function moveMessageInMessage($idDrop, $idDragged, $user)
    {
        $messageDragged = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDragged);
        $messageDrop = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDrop);
        if ($messageDrop == null || $messageDragged == null) {
            return false;
        }

        $messageDrop->setHasResponses(true);
        $messageDragged->setResponseTo($messageDrop);

        $this->doctrine->persist($messageDrop);
        $this->doctrine->persist($messageDragged);

        $this->setResponseMessage($messageDragged, $messageDrop);
        $this->doctrine->flush();

        return $messageDragged->getAsArray();

    }

    public function moveMessageOutMessage($idDragged, $user)
    {
        $messageDragged = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->find($idDragged);
        if ($messageDragged == null) {
            return false;
        }

        $oldMessage = $messageDragged->getResponseTo();
        if ($oldMessage == null) {
            return false;
        }
        $messageDragged->setResponseTo(null);
        $this->doctrine->persist($messageDragged);
        $this->doctrine->flush();

        return $messageDragged->getAsArray();

    }

    public function getResponseMessages($messageParentId){
        $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo" => $messageParentId));

        return $messages;
    }

    private function setResponseMessage($messageParent, $messageDroped)
    {
        $messages = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo" => $messageParent));

        $messageDroped->setHasResponses(true);
        $this->doctrine->persist($messageDroped);

        foreach ($messages as $message) {
            $message->setResponseTo($messageDroped);
            $this->doctrine->persist($message);
            $this->setResponseMessage($message, $messageDroped);
        }
    }

    /*  isInSubject : if we want only sumup subject or not
        isResponse : want to return response
    */
    public function getMessageAsArray($message, $isInSubject = false, $isResponse = false)
    {
        if ($message->getResponseTo() != null) {
            if (!$isResponse) {
                return false;
            } else {
                return $this->getMessageAsArray($message->getResponseTo());
            }
        }
        $retour = false;
        if ($message->getSubject() != null) {
            if ($isInSubject) {
                $retour = $message->getAsArray();
            } else {
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
        } else {
            $retour = $message->getAsArray();
        }
        if ($retour) {
            $responses = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findBy(Array("responseTo" => $message), Array("date" => "ASC"));
            foreach ($responses as $response) {
                $retour["responses"][] = $response->getAsArray();
            }
        }
        return $retour;
    }

    public function searchDriveMessage($discussionKey, $user)
    {
        $discussionInfos = $this->convertKey($discussionKey, $user);
        $stream = $this->getStream($discussionKey, $user->getId());
        if (!$this->isAllowed($stream, $user)) {
            return false;
        }
        $driveApp = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("url" => "drive"));
        $messages = null;
        if ($driveApp != null) {
            $messages = $this->searchMessage($discussionInfos["id"], "", null, null, null, $driveApp, $user);
            $retour = [];
            foreach ($messages as $message) {
                $mess = $message->getAsArray();
                $mess["file"] = $this->fileSystemAdapter->getFileSystem()->getInfos(null, $message->getApplicationData()["file"], true);
                $retour[] = $mess;
            }
        }
        return $retour;
    }

    public function notify($streamId, $type, $messageArray)
    {
        $data = Array(
            "type" => $type,
            "data" => $messageArray,
        );
        $this->pusher->push($data, "discussion/" . $streamId);
    }

    public function makeCall($streamId, $subjectId, $workspaceId, User $user, $respondTo, $objectLinkName = false)
    {

        $token = "twake-" . bin2hex(random_bytes(20));
        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "calls"));

        $url = Array("iframe" => "./calls.html?token=$token");


        if($objectLinkName){
            $call = new Call($token, $objectLinkName);
            $this->doctrine->persist($call);
            $this->doctrine->flush();
            return $call;
        } else {
            //sendMessage($senderId, $key, $isApplicationMessage, $applicationId, $isSystemMessage, $content, $workspace, $subjectId = null, $messageData = null, $notify = true, $front_id = "")
            $message = $this->sendMessage($user->getId(), "s-" . $streamId, true, $app->getId(), false, "", $workspaceId, $subjectId, $url, true, "", $respondTo);
            $messageArray = $message->getAsArray();
            $this->notify("s-" . $streamId, "C", $messageArray);
        }

        return true;
    }
}
