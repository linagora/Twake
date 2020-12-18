<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;

/**
 * This class will do updates in Twake from Twake console
 */
class Utils
{
    /** @var App */
    protected $app = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
        $this->user_service = $app->getServices()->get("app.user");
    }
    
    function getCompany($companyConsoleId){
        $extRepository = $this->em->getRepository("Twake\Workspaces:ExternalGroupRepository");
        $company_link = $extRepository->findOneBy(Array("service_id" => "console", "external_id" => $companyConsoleId));

        $company = null;
        if ($company_link) {
            $twakeCompanyId = $company_link->getGroupId();
            $companyRepository = $this->em->getRepository("Twake\Workspaces:Group");
            $company = $companyRepository->find($twakeCompanyId);
        }
        return $company;
    }
    
    function getUser($userConsoleId){
        $extRepository = $this->em->getRepository("Twake\Users:ExternalUserRepository");
        $user_link = $extRepository->findOneBy(Array("service_id" => "console", "external_id" => $userConsoleId));

        $user = null;
        if ($user_link) {
            $twakeUserId = $user_link->getUserId();
            $userRepository = $this->em->getRepository("Twake\Users:User");
            $user = $userRepository->find($twakeUserId);
        }
        return $user;
    }

}
