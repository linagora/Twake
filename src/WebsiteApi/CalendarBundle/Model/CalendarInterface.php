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
interface CalendarInterface
{
	// @create creates a calendar
	public function createCalendar($group,$title,$description);

	public function getCalendars($group);

}