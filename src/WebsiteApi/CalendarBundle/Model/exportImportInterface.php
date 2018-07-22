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
    public function generateICsFileWithUrl($workspace_id, $calendar_id, $mine, $from, $to, $user_id);

    public function parseCalendar($workspace_id, $calendar_id);

}