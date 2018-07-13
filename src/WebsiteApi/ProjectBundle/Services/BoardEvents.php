<?php


namespace WebsiteApi\ProjectBundle\Services;

use Symfony\Component\Validator\Constraints\DateTime;
use WebsiteApi\ProjectBundle\Entity\BoardTask;
use WebsiteApi\ProjectBundle\Entity\Event;
use WebsiteApi\ProjectBundle\Entity\LinkBoardWorkspace;
use WebsiteApi\ProjectBundle\Entity\LinkTaskUser;
use WebsiteApi\ProjectBundle\Model\BoardEventsInterface;

/**
 * Manage board
 */
class BoardEvents implements BoardEventsInterface
{

    var $doctrine;
    var $pusher;
    var $workspaceLevels;
    var $notifications;
    /* @var BoardActivities $boardActivity */
    var $boardActivity;

    public function __construct($doctrine, $pusher, $workspaceLevels, $notifications, $serviceBoardActivity)
    {
        $this->doctrine = $doctrine;
        $this->pusher = $pusher;
        $this->workspaceLevels = $workspaceLevels;
        $this->notifications = $notifications;
        $this->boardActivity = $serviceBoardActivity;
    }

    public function createEvent($workspaceId, $boardId, $event, $currentUserId = null, $addMySelf = false, $participants=Array())
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        if(!isset($event["from"]) || !isset($event["to"])){
            return null;
        }

        $event = new BoardTask($event, $event["from"], $event["to"]);
        $eventModified = $event->getEvent();
        $eventModified["title"] = isset($event->getEvent()["title"])? $event->getEvent()["title"] : "event";
        $eventModified["typeEvent"] = isset($event->getEvent()["typeEvent"])? $event->getEvent()["typeEvent"] : "event";

        $event->setEvent($eventModified);
        $event->setReminder();
        $event->setBoard($board);
        $participantsArray = Array();
        $event->setParticipant($participantsArray);
        $this->doctrine->persist($event);
        $this->doctrine->flush();

        foreach($participants as $participant)
        {
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($participant);
            if($user != null){
                $this->addUsers($workspaceId,$boardId,$event,Array($user->getId()));
                $participantsArray[] = $user->getId();
            }
        }
        $calArray = $board->getAsArray();

        $event->setParticipant($participantsArray);

        $this->doctrine->persist($event);

        if ($calArray["autoParticipate"] != null && is_array($calArray["autoParticipate"])) {
            foreach ($calArray["autoParticipate"] as $userAuto){
                $this->addUsers($workspaceId, $boardId, $event->getId(),Array($userAuto), $currentUserId);
            }
        }

        if($addMySelf){
            $this->addUsers($workspaceId, $boardId, $event, Array($currentUserId), $currentUserId);
        }


        $data = Array(
            "type" => "create",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);
        $this->doctrine->flush();

        return $event;

    }

    public function updateEvent($workspaceId, $boardId, $eventId, $eventArray, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        if(!isset($eventArray["from"]) || !isset($eventArray["to"])){
            return null;
        }


        $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->find($eventId);

        if(!$event){
            return null;
        }

        //If we changed board verify that old board is our board
        if($event->getBoard()->getId() != $boardId){
            $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $event->getBoard()));
            if(!$boardLink){
                return null;
            }
        }

        /* @var BoardTask $event */

        $event->setBoard($board);
        $event->setEvent($eventArray);
        $event->setFrom($eventArray["from"]);
        $event->setTo($eventArray["to"]);
        $event->setParticipant($eventArray["participant"]);
        if (isset($eventArray["reminder"])) {
            $event->setReminder(intval($eventArray["reminder"]));
        } else {
            $event->setReminder();
        }
        $this->doctrine->persist($event);

        $usersLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser")->findBy(Array("event"=>$event));
        foreach ($usersLinked as $userLinked){
            $userLinked->setFrom($event->getFrom());
            $userLinked->setTo($event->getTo());
            $this->doctrine->persist($userLinked);
        }

        $this->doctrine->flush();

        $data = Array(
            "type" => "update",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);

        return $event;
    }

    public function removeEvent($workspaceId, $boardId, $eventId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->find($eventId);

        if(!$event || $event->getBoard()->getId() != $boardId){
            return null;
        }

        $usersLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser")->findBy(Array("event"=>$event));
        foreach ($usersLinked as $userLinked){
            $this->doctrine->remove($userLinked);
        }

        $this->doctrine->remove($event);
        $this->doctrine->flush();

        $data = Array(
            "type" => "remove",
            "event_id" => $eventId
        );
        $this->pusher->push($data, "board/".$boardId);

        return true;
    }

    public function addUsers($workspaceId, $boardId, $event, $usersId, $currentUserId = null)
    {
        $eventId = null;
        if(is_int($event) || is_string($event))
            $eventId = $event;
        error_log("ADD USERS");
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        if($eventId!=null)
            $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->find($eventId);

        if(!$event || $event->getBoard()->getId() != $boardId){
            return null;
        }

        /* @var BoardTask $event */

        foreach ($usersId as $userId) {
            if($userId != null){ //pour eviter un bug du front
                $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
                $eventUserRepo = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser");
                $userLink = $eventUserRepo->findBy(Array("user"=>$user,"event"=>$event));
                if($userLink== false){
                    $userLinked = new LinkTaskUser($user, $event);
                    $userLinked->setFrom($event->getFrom());
                    $userLinked->setTo($event->getTo());
                    $this->doctrine->persist($userLinked);
                    $participantArray = $event->getParticipant();
                    $participantArray[] = $user->getId();
                }
                $this->boardActivity->pushActivity(true, $workspaceId, $user, null, "Added  to ".$event->getEvent()["title"],"You have a new event the ".date('d/m/Y', $event->getFrom()), Array(), Array("notifCode" => $event->getFrom()."/".$event->getId()));
            }
        }
        $event->setParticipant($participantArray);
        $this->doctrine->flush();
        $data = Array(
            "type" => "update",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);
        return true;

    }

    public function removeUsers($workspaceId, $boardId, $eventId, $usersId, $currentUserId = null)
    {

        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:write")) {
            return null;
        }

        $board = $this->doctrine->getRepository("TwakeProjectBundle:Board")->find($boardId);
        $boardLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("workspace" => $workspace, "board" => $board));

        if(!$boardLink){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->find($eventId);

        if(!$event || $event->getBoard()->getId() != $boardId){
            return null;
        }


        $participantArray = $event->getParticipant();
        foreach ($usersId as $userId){
            error_log("remove ".$userId);
            $user = $this->doctrine->getRepository("TwakeUsersBundle:User")->find($userId);
            $userLinked = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser")->findOneBy(Array("user"=>$user, "event"=>$event));
            $this->doctrine->remove($userLinked);
            for($i=0;$i<count($participantArray);$i++){
                if($participantArray[$i] == $user->getId()){
                    error_log("remove from array ".$i.", ".json_encode($participantArray));
                    unset($participantArray[$i]);
                    $participantArray = array_values($participantArray);
                    error_log("array after remove : ".json_encode($participantArray));
                    $this->boardActivity->pushActivity(true, $workspaceId, $user, null, "Removed  to ".$event->getEvent()["name"],"You have been removed from ".$event->getEvent()["name"], Array(), Array("notifCode" => $event->getFrom()."/".$event->getId()));
                    break;
                }
            }
        }

        $event->setParticipant($participantArray);
        $this->doctrine->persist($event);
        $this->doctrine->flush();
        $data = Array(
            "type" => "update",
            "event" => $event->getAsArray()
        );
        $this->pusher->push($data, "board/".$boardId);

        return true;

    }

    public function getEventsForWorkspace($workspaceId, $from, $to, $boardsId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))) {
            return null;
        }

        $events = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->getBoardsEventsBy($from, $to, $boardsId);

        return $events;
    }

    public function getEvent($eventId,$workspaceId, $currentUserId){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($workspace==null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))) {
            return null;
        }

        /* @var BoardTask $event*/
        $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->findOneBy(Array("id"=>$eventId));
        if($event==null)
            return; false;
        /* @var LinkBoardWorkspace $workspaceLink*/
        $workspaceLink = $this->doctrine->getRepository("TwakeProjectBundle:LinkBoardWorkspace")->findOneBy(Array("board"=>$event->getBoard()));

        if(!$workspaceLink)
            return false;

        if($workspaceLink->getWorkspace()->getId()==$workspaceId)
            return $event;

        return false;
    }
    //
    public function getEventsByBoard($workspaceId, $boardsId, $currentUserId = null){
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));
        var_dump($workspaceId);
        var_dump($boardsId);
        if($workspace == null || ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read"))){
            return null;
        }
        $events = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->getAllBoardEventsByBoard($boardsId);

        foreach ($events as $link) {
            $evt = $link->getAsArray();

            $result[] = $evt;
        }

        return $result;
    }

    public function getEventsForUser($workspaceId, $from, $to, $currentUserId)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read")) {
            return null;
        }

        $eventsLinks = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser")->getForUser($from, $to, $currentUserId);

        $events = Array();
        foreach ($eventsLinks as $eventLink){
            $events[] = $eventLink->getEvent();
        }

        return $events;

    }

    public function getEventById($workspaceId, $eventId, $currentUserId = null)
    {
        $workspace = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspaceId, "isDeleted" => false));

        if ($currentUserId && !$this->workspaceLevels->can($workspace->getId(), $currentUserId, "board:read")) {
            return null;
        }

        if($workspace==null ){
            return null;
        }

        $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->find($eventId);
        if(!$event){
            return null;
        }else{

            $event = $event->getAsArray();

        }


        return $event;
    }

    public function getUsers( $eventId, $currentUserId = null)
    {
        $event = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->find($eventId);

        if(!$event ){
            return null;
        }

        $eventUserRepo = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser");
        $users = Array();
        $eventUsers = $eventUserRepo->findBy(Array("event"=>$event));

        foreach ($eventUsers as $user){
            $users[] = $user->getUser()->getAsArray();
        }

        return $users;

    }

    /** Check all events that have to be reminded */
    public function checkReminders()
    {

        /** @var BoardTask[] $events */
        $events = $this->doctrine->getRepository("TwakeProjectBundle:BoardEvent")->toRemind();
        $linkRepo = $this->doctrine->getRepository("TwakeProjectBundle:LinkEventUser");

        $app = $this->doctrine->getRepository("TwakeMarketBundle:Application")->findOneBy(Array("publicKey" => "board"));

        foreach ($events as $event) {

            $date = $event->getFrom();
            $in = $date - date("U");
            $in = $in / 60;
            if ($in < 60) {
                $in = intval($in) . " minute(s) ";
            } else if ($in / 60 < 24) {
                $in = intval($in / 60) . " hour(s) ";
            } else {
                $in = intval($in / (60 * 24)) . " day(s) ";
            }

            $title = "Event";
            if (isset($event->getEvent()["title"])) {
                $title = $event->getEvent()["title"];
            }
            $text = $title . " in " . $in;

            $_users = $linkRepo->findBy(Array("event" => $event));
            if (count($_users) > 0) {
                $users = Array();
                foreach ($_users as $user) {
                    $users[] = $user->getUser()->getId();
                }
                $this->notifications->pushNotification($app, null, $users, null, "event_" . $event->getId(), $text, Array("push"), null, false);
            }


            $event->setNextReminder(0);
            $this->doctrine->persist($event);

        }

        $this->doctrine->flush();
        return true;
    }
}