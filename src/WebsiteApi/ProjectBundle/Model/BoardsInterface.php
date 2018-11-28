<?php

namespace WebsiteApi\ProjectBundle\Model;

//TODO : - replace current arguments by service arguments (no $request)
//       - reduce the number of function if possible
//       - add comments

/**
 * This is an interface for the service Board
 *
 * This service is responsible of all s regarding the Drive it should be used everytime
 */
interface BoardsInterface
{

    // @getBoards returns boards for a workspace
    public function getBoards($workspaceId, $currentUserId=null);

    // @createBoard creates a board
    public function createBoard($workspaceId, $title, $description, $isPrivate, $currentUserId, $useridtonotify);

    // @updateBoard update a board
    public function updateBoard($boardId, $title, $description, $isPrivate, $currentUserId = null, $autoParticipate = Array(), $useridtonotify = Array());

    // @removeBoard remove a board
    public function removeBoard($workspaceId, $boardId, $currentUserId = null);

    // @shareBoard share a board with an other workspace
    public function shareBoard($workspaceId, $boardId, $other_workspaceId, $hasAllRights = true, $currentUserId = null);

    // @unshareBoard cancel board sharing
    public function unshareBoard($workspaceId, $boardId, $other_workspaceId, $currentUserId = null);

    // @getBoardShare return list of other workspaces sharing the same board
    public function getBoardShare($workspaceId, $boardId, $currentUserId = null);

}