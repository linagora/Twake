<?php

namespace WebsiteApi\CalendarBundle\Model;

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
    public function getCalendars($workspace, $currentUserId=null);

    // @createCalendar creates a calendar
    public function createCalendar($workspace, $label, $color, $currentUserId = null);

    // @removeCalendar remove a calendar
    public function removeCalendar($workspace, $calendarId, $currentUserId = null);

    // @shareCalendar share a calendar with an other workspace
    public function shareCalendar($workspace, $calendarId, $other_workspace, $currentUserId = null);

    // @unshareCalendar cancel calendar sharing
    public function unshareCalendar($workspace, $calendarId, $other_workspace, $currentUserId = null);

    // @getCalendarShare return list of other workspaces sharing the same calendar
    public function getCalendarShare($workspace, $calendarId, $currentUserId = null);

}