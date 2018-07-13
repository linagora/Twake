<?php
/**
 * Created by PhpStorm.
 * User: laura
 * Date: 28/06/18
 * Time: 10:09
 */

namespace WebsiteApi\ProjectBundle\Model;


interface exportImportInterface
{
    public function generateIcsFileForBoard($workspace_id, $board_id);
    function parseBoard( $workspace_id, $board_id);
    public function generateIcsFileForTask($workspace_id, $task_id);

    }