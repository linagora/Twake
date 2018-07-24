<?php

namespace WebsiteApi\ProjectBundle\Controller;

use phpDocumentor\Reflection\Types\Array_;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;


class BoardController extends Controller
{

    public function getBoardsAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId",0);
        $boards = $this->get("app.boards")->getBoards($workspaceId, $this->getUser()->getId());

        if ($boards){
            foreach ($boards as $board) {
                $boardArray = $board->getAsArray();
                $boardArray["owner"] = $this->getUser()->getAsArray();
                $boardArray["percent"] = $this->get("app.boards")->getBoardPercent($board);
                $data['data'][] = $boardArray;
            }
        }

        return new JsonResponse($data);
    }

    public function getAutoParticipateByBoard(Request $request){
        $data = Array(
            'error' => Array(),
            'data' => Array()
        );
        $workspaceId = $request->request->get("workpsaceId");
        $boardId = $request->request->get("boardId");
        $board = ($this->get("app.boards")->getBoardById($workspaceId,$boardId))->getAsArray();

        $data['data'] = $board["autoParticpate"] ;
        return new JsonResponse($data);
    }

    public function createBoardAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $title = $request->request->get("name", "");
        $description = $request->request->get("description", "");
        $isPrivate = $request->request->get("isPrivate",false);

        $data['data'] = $this->get("app.boards")->createBoard($workspaceId, $title,$description,$isPrivate, $this->getUser()->getId());

        if($data['data'])
            $data['data'] = $data['data']->getAsArray();

        return new JsonResponse($data);
    }

    public function updateBoardAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $boardId = $request->request->get("id");
        $title = $request->request->get("name", "");
        $description = $request->request->get("description", "");
        $isPrivate = $request->request->get("isPrivate",false);
        $participants = $request->request->get("members",Array());

        $data['data'] = $this->get("app.boards")->updateBoard($boardId, $title, $description, $isPrivate, $this->getUser(), Array(),$participants);

        if($data['data'])
            $data['data'] = $data['data']->getAsArray();

        return new JsonResponse($data);
    }

    public function removeBoardAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId",  0);
        $boardId = $request->request->get("id",0);

        $data['data'] = $this->get("app.boards")->removeBoard($workspaceId, $boardId, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function shareBoardAction(Request $request)
    {
        $data = Array(
            'errors' => Array(),
            'data' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $hasAllRights = $request->request->get("hasAllRights");
        $other_workspaceId = $request->request->get("otherWorkspaceId");
        $boardId = $request->request->get("boardId");

        $data['data'] = $this->get("app.boards")->shareBoard($workspaceId, $boardId, $other_workspaceId, $hasAllRights, $this->getUser()->getId());

        return new JsonResponse($data);
    }

    public function unshareBoardAction(Request $request)
    {
        $data = Array(
            'errors' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $other_workspaceId = $request->request->get("otherWorkspaceId");
        $boardId = $request->request->get("boardId");

        $data['data'] = $this->get("app.boards")->unshareBoard($workspaceId, $boardId, $other_workspaceId, $this->getUser()->getId());


        return new JsonResponse($data);
    }

    public function getShareBoardAction(Request $request)
    {
        $data = Array(
            'errors' => Array()
        );

        $workspaceId = $request->request->get("workspaceId");
        $boardId = $request->request->get("boardId");

        $linkBoards = $this->get("app.boards")->getBoardShare($workspaceId, $boardId, $this->getUser()->getId());

        $boards_formated = Array();
        foreach ($linkBoards as $board){
            if($board->getWorkspace() != null){
                $boards_formated[] = $board->getWorkspace()->getAsArray();
            }

        }
        $data['data'] = $boards_formated;

        return new JsonResponse($data);
    }

    public function importBoardAction(Request $request){

        $workspaceID = $_POST["workspaceId"];
        $boardId = $_POST["boardId"];
        $parsing = $this->get("app.export_import")->parseBoard($workspaceID,$boardId);
        return $parsing;
    }

    public function exportBoardAction(Request $request, $workspaceId, $boardsIds, $useMine, $from, $to){
        if($useMine==1){
            $user_id = $this->getUser()->getId();

        }else{
            $user_id = null;
        }
        $from = ($from>=(strtotime('-1 year', (new \DateTime())->getTimestamp())) && $from <=strtotime('-1 year', (new \DateTime())->getTimestamp())) ? $from : (new \DateTime())->getTimestamp();
        $to = ($to<=(strtotime('-1 year', (new \DateTime())->getTimestamp())) && $to>=strtotime('+1 year', (new \DateTime())->getTimestamp())) ? $to : strtotime('+1 year', (new \DateTime())->getTimestamp()) ;

        $parsing = $this->get("app.export_import")->generateIcsFileWithUrl($workspaceId,$boardsIds,$useMine,$from,$to, $user_id);
        return $parsing;
    }

}