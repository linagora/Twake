<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 08/06/18
 * Time: 11:53
 */

namespace Twake\Market\Services;

use App\App;
use Twake\Market\Entity\DataToken;

class DataTokenSystem
{
    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
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
        $dataTokenRepository = $this->doctrine->getRepository("Twake\Market:DataToken");
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
        $workspaceUserRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUser");

        $workspaceUser = $workspaceUserRepository->findOneBy(Array("workspace_id" => $workspaceId, "user_id" => $userId));

        return $workspaceUser != null;
    }
}