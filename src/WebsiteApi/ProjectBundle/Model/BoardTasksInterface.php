<?php

namespace WebsiteApi\ProjectBundle\Model;

//TODO : - replace current arguments by service arguments (no $request)
//       - reduce the number of function if possible
//       - add comments

/**
 * This is an interface for the service Task
 *
 * This service is responsible of all s regarding the Drive it should be used everytime
 */
interface BoardTasksInterface
{
    public function createTask($boardId, $task, $name, $description, $startDate, $endDate, $dependingTaskId, $currentUserId = null, $addMySelf = false, $participants=Array(), $weight=1);

    public function updateTask($workspaceId, $boardId, $taskId, $task, $currentUserId=null);

    public function removeTask($workspaceId, $boardId, $taskId, $currentUserId=null);

    public function addUsers($workspaceId, $boardId, $taskId, $usersId, $currentUserId=null);

    public function removeUsers($workspaceId, $boardId, $taskId, $usersId, $currentUserId=null);

    public function getTasksForWorkspace($workspaceId, $boardsId, $currentUserId=null);

    public function getTasksForUser($workspaceId, $currentUserId);

}