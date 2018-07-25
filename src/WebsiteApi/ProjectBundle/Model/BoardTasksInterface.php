<?php

namespace WebsiteApi\ProjectBundle\Model;

/**
 * This is an interface for the service Task
 */
interface BoardTasksInterface
{
    public function createTask($boardId, $task, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $userIdsToNotify=Array(), $weight=1);

    public function updateTask($workspaceId, $boardId, $taskId, $task, $currentUserId=null);

    public function removeTask($workspaceId, $boardId, $taskId, $currentUserId=null);
}