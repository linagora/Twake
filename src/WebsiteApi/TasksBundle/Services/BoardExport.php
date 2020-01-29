<?php


namespace WebsiteApi\TasksBundle\Services;

use WebsiteApi\TasksBundle\Entity\ExportToken;

class BoardExport
{

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function generateToken($request, $current_user = null)
    {

        $user_id = $current_user->getId();

        $workspace_id = $request->request->get('workspace_id');
        $boards = $request->request->get('boards');

        $token = bin2hex(random_bytes(64));

        //Insert to export_token table
        $entity = new ExportToken($user_id, $workspace_id, $boards, $token);
        $this->doctrine->persist($entity);
        $this->doctrine->flush();

        return $token;

    }


    public function exportBoard($token, $boardTaskService)
    {
    }


    public function importBoard($token, $boardTaskService)
    {
    }

}
