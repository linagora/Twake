<?php

namespace WebsiteApi\_old_CalendarBundle\Model;

//TODO : - replace current arguments by service arguments (no $request)
//       - reduce the number of function if possible
//       - add comments

/**
 * This is an interface for the service Calendar
 *
 * This service is responsible of all s regarding the Drive it should be used everytime
 */
interface CalendarsInterface
{

    // @getCalendars returns calendars for a workspace
    public function getCalendars($workspaceId, $currentUserId=null);

    // @createCalendar creates a calendar
    public function createCalendar($workspaceId, $label, $color, $currentUserId = null);

    // @removeCalendar remove a calendar
    public function updateCalendar($workspaceId, $calendarId, $label, $color, $currentUserId = null);

    // @removeCalendar remove a calendar
    public function removeCalendar($workspaceId, $calendarId, $currentUserId = null);

    // @shareCalendar share a calendar with an other workspace
    public function shareCalendar($workspaceId, $calendarId, $other_workspaceId, $hasAllRights = true, $currentUserId = null);

    // @unshareCalendar cancel calendar sharing
    public function unshareCalendar($workspaceId, $calendarId, $other_workspaceId, $currentUserId = null);

    // @getCalendarShare return list of other workspaces sharing the same calendar
    public function getCalendarShare($workspaceId, $calendarId, $currentUserId = null);

}