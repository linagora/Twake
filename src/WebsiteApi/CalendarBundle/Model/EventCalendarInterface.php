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
interface EventCalendarInterface
{
    public function createEvent($owner,$title,$startDate,$endDate,$description,$location,$color,$linkCalendar,$appid);

    public function getEventsByOwner($owner);

    public function getEventsByCalendar($cal);

}