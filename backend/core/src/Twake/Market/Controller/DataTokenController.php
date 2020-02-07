<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 08/06/18
 * Time: 12:01
 */

namespace Twake\Market\Controller;


use Common\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DataTokenController extends BaseController
{
    public function makeToken(Request $request)
    {
        $user = $this->getUser();

        $data = Array(
            "errors" => Array(),
            "data" => null
        );

        if ($user != null) {
            $userId = $user->getId();
        } else {
            return new JsonResponse($data);
        }

        $workspaceId = $request->request->get("workspaceId", 0);

        $success = $this->get("website_api_market.data_token")->checkWorkspaceUser($workspaceId, $userId);

        if (!$success) {
            return new JsonResponse($data);
        }

        $dataToken = $this->get("website_api_market.data_token")->makeToken($workspaceId, $userId);

        $data["data"] = $dataToken->getToken();

        return new JsonResponse($data);
    }
}