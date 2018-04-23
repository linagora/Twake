<?php

namespace WebsiteApi\CalendarBundle\Model;

//TODO : - replace current arguments by service arguments (no $request)
//       - reduce the number of function if possible
//       - add comments

/**
 * This is an interface for the service Event
 *
 * This service is responsible of all s regarding the Drive it should be used everytime
 */
interface CalendarEventsInterface
{
    public function createEvent($workspaceId, $calendarId, $event, $currentUserId=null);

    public function updateEvent($workspaceId, $calendarId, $eventId, $event, $currentUserId=null);

    public function removeEvent($workspaceId, $calendarId, $eventId, $currentUserId=null);

    public function addUsers($workspaceId, $calendarId, $eventId, $usersId, $currentUserId=null);

    public function removeUsers($workspaceId, $calendarId, $eventId, $usersId, $currentUserId=null);

    public function getEventsForWorkspace($workspaceId, $from, $to, $calendarsId, $currentUserId=null);

    public function getEventsForUser($workspaceId, $from, $to, $currentUserId);

}