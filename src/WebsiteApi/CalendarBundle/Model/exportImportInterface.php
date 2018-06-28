<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 28/06/18
 * Time: 10:09
 */

namespace WebsiteApi\CalendarBundle\Model;


interface exportImportInterface
{
    public function generateIcsFileForCalendar($workspace_id, $calendar_id);
    function parseCalendar( $workspace_id, $calendar_id);
    public function generateIcsFileForEvent($workspace_id, $event_id);

    }