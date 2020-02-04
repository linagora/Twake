<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 08/06/18
 * Time: 11:53
 */

namespace WebsiteApi\MarketBundle\Services;


use WebsiteApi\MarketBundle\Entity\DataToken;

class DataTokenSystem
{
    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function makeToken($workspaceId, $userId)
    {
        $dataToken = new DataToken($workspaceId, $userId);

        $this->doctrine->persist($dataToken);
        $this->doctrine->flush();

        return $dataToken;
    }

    public function getDataToken($token)
    {
        $dataTokenRepository = $this->doctrine->getRepository("TwakeMarketBundle:DataToken");
        $dataToken = $dataTokenRepository->findOneBy(Array("token" => $token));
        if ($dataToken == null)
            return false;

        $data["workspaceId"] = $dataToken->getWorkspaceId();
        $data["userId"] = $dataToken->getUserId();

        $dataTokenRepository->removeToken($dataToken->getToken());

        return $data;
    }

    public function checkWorkspaceUser($workspaceId, $userId)
    {
        $workspaceUserRepository = $this->doctrine->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

        $workspaceUser = $workspaceUserRepository->findOneBy(Array("workspace" => $workspaceId, "user" => $userId));

        return $workspaceUser != null;
    }
}