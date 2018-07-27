<?php

namespace WebsiteApi\ProjectBundle\Model;

/**
 * This is an interface for the service Task
 */
interface BoardTasksInterface
{
    public function createTask($boardId, $task, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $userIdsToNotify=Array(), $participants=Array(), $weight=1, $labels=Array());

    public function updateTask($taskId, $taskArray, $name, $description, $startDate, $endDate, $dependingTaskId, $userId, $userToNotify,$participants, $weight, $labels);

    public function removeTask($taskId, $currentUserId=null);
}