<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;
use Common\BaseController;
use Common\Http\Request;
use Common\Http\Response;

class Api extends BaseController
{


    /** @var TwakeRestClient */
    protected $api = null;

    /** @var String */
    protected $endpoint = null;

    /** @var String */
    private $authB64 = "";

    public function __construct(App $app)
    {
        parent::__construct($app);
        $this->api = $app->getServices()->get("app.restclient");
        $this->endpoint = $this->getParameter("defaults.auth.console.provider");
        $this->authB64 = base64_encode(
            $this->getParameter("defaults.auth.console.credentials.key")
            .  ":"
            . $this->getParameter("defaults.auth.console.credentials.secret"));
    }

    /**
     * Send again the verification email for an user
     */
    public function verifyMail(Request $request)
    {
        if(!$this->getUser()){
            return new Response(["error" => "disconnected"]);
        }
        
        $data = [
            "email" => $this->getUser()->getEmail()
        ];
        $header = "Authorization: Basic " . $this->authB64;
        $response = $this->api->post(rtrim($this->endpoint, "/") . "/users/resend-verification-email", json_encode($data), array(CURLOPT_HTTPHEADER => [$header, "Content-Type: application/json"]));
        $result = json_decode($response->getContent(), 1);

        return new Response(["data" => $result]);
    }

    /**
     * Invite a list of emails to a workspace
     */
    public function invite(Request $request)
    {
        $companyId = $request->request->get("company_id", "");
        $workspaceId = $request->request->get("workspace_id", "");
        $asExterne = false;
        $emails =  $request->request->get("emails", []);

        // Get company code
        $doctrine = $this->get("app.twake_doctrine");
        $groupRepository = $doctrine->getRepository("Twake\Workspaces:Group");
        $company = $groupRepository->find($companyId);

        if(!$company || $company->getIdentityProvider() !== "console"){
            return new Response(["error" => "not a console company"]);
        }

        // Check user is connected and part of the requested company
        $groupUserRepository = $doctrine->getRepository("Twake\Workspaces:GroupUser");
        $workspaceUserRepository = $doctrine->getRepository("Twake\Workspaces:WorkspaceUser");
        $companyUser = $groupUserRepository->findOneBy(Array("group" => $companyId, "user" => $this->getUser()->getId()));
        $workspaceUser = $groupUserRepository->findOneBy(Array("workspace_id" => $workspaceId, "user_id" => $this->getUser()->getId()));
        if(!$companyUser || !$workspaceUser){
            return new Response(["error" => "user not in company or workspace"]);
        }

        // Also add the emails as pending on Twake side
        $workspaceUserByMailRepository = $this->doctrine->getRepository("Twake\Workspaces:WorkspaceUserByMail");
        foreach($emails as $mail){
            $this->get("app.workspace_members")->addMemberByMail($workspaceId, $mail, $asExterne, $this->getUser()->getId(), false);
        }

        $companyCode = $company->getIdentityProviderId();
        $data = [
            "emails" => $emails
        ];

        $header = "Authorization: Basic " . $this->authB64;
        $response = $this->api->post(rtrim($this->endpoint, "/") . "/companies/" . $companyCode . "/users/invitation", json_encode($data), array(CURLOPT_HTTPHEADER => [$header, "Content-Type: application/json"]));
        $result = json_decode($response->getContent(), 1);

        return new Response(["data" => $result]);
    }

}
