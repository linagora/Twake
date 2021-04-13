<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;
use Twake\Users\Services\PasswordEncoder;
use Twake\Workspaces\Entity\Group;
use Twake\Workspaces\Entity\GroupUser;
use Twake\Workspaces\Entity\ExternalGroupRepository;
use Twake\Upload\Entity\File;

/**
 * This class will do updates in Twake from Twake console
 */
class ApplyUpdates
{
    /** @var App */
    protected $app = null;

    /** @var String */
    protected $endpoint = null;

    public function __construct(App $app)
    {
        $this->app = $app;
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->endpoint = $app->getContainer()->getParameter("defaults.auth.console.provider");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
        $this->user_service = $app->getServices()->get("app.user");
    }
    
    function updateCompany($companyDTO){
        error_log("apply:updateCompany with params: ". json_encode([$companyDTO]));

        $companyConsoleCode = $companyDTO["company"]["details"]["code"];

        $extRepository = $this->em->getRepository("Twake\Workspaces:ExternalGroupRepository");
        $company_link = $extRepository->findOneBy(Array("service_id" => "console", "external_id" => $companyConsoleCode));

        $company = null;
        if ($company_link) {
            $twakeCompanyId = $company_link->getGroupId();
            $companyRepository = $this->em->getRepository("Twake\Workspaces:Group");
            $company = $companyRepository->find($twakeCompanyId);
        }
        if(!$company) {
            //Create company
            $company = new Group($companyDTO["company"]["details"]["name"]);

            $this->em->persist($company);
            $this->em->flush();

            $company_link = new ExternalGroupRepository("console", $companyConsoleCode, $company->getId());
            $this->em->persist($company_link);
        }

        $company->setName($companyDTO["company"]["details"]["name"]);
        $company->setDisplayName($companyDTO["company"]["details"]["name"]);
        $company->setIdentityProvider("console");
        $company->setIdentityProviderId($companyConsoleCode);

        $avatar = $userDTO["company"]["details"]["avatar"];
        $picture = $companyDTO["value"] ?: "";
        if($avatar["type"] && $avatar["type"] !== "url"){
            $picture = rtrim($this->endpoint, "/") . "/avatars/" . $avatar["value"];
        }
        $company->setLogo($picture);

        // Format is {name: "string", limits: {}}
        $company->setPlan($companyDTO["company"]["plan"]);

        // Format is {}
        $company->setStats($companyDTO["company"]["stats"]);

        $logo = $companyDTO["company"]["details"]["logo"];
        if ($logo) {
            $company->setLogo($logo);
        }

        $this->em->persist($company);
        $this->em->flush();

        $this->app->getServices()->get("app.groups")->init($company);

        return $company;

    }
    
    function removeCompany($companyConsoleCode){
        //Not implemented
        error_log("not implemented");
        return false;
    }

    /**
     * Take a user from api and save it into PHP
     */
    function updateUser($userDTO){
        error_log("apply:updateUser with params: ". json_encode([$userDTO]));

        $roles = $userDTO["roles"];

        $userConsoleId = $userDTO["_id"];

        $email = $userDTO["email"];
        $username = preg_replace("/ +/", "_",
            preg_replace("/[^a-zA-Z0-9]/", "",
                trim(
                    strtolower(
                        explode("@", $userDTO["email"])[0]
                    )
                )
            )
        );

        // Create user if needed
        $user = $this->user_service->getUserFromExternalRepository("console", $userConsoleId);
        if (!$user) {
            //Create user on our side

            //Find allowed username / email
            $counter = 1;
            $original_username = $username;
            $ok = false;
            $mailUsedError = false;
            $usernameUsedError = false;
            do {
                $res = $this->user_service->getAvaibleMailPseudo($email, $username);
                if ($res !== true) {
                    if (in_array(-1, $res)) {
                        //Mail used
                        $mailUsedError = true;
                        break;
                    }
                    if (in_array(-2, $res)) {
                        //Username used
                        $username = $original_username . $counter;
                        $usernameUsedError = true;
                    }else{
                        $usernameUsedError = false;
                        $ok = true;
                    }
                }else{
                    $usernameUsedError = false;
                    $ok = true;
                }
                $counter++;
            } while (!$ok && $counter < 1000);
            if($mailUsedError || $usernameUsedError){
                error_log("Console user not created because mail exists or username exists:");
                error_log("Username used " . $username . ": " . ( $usernameUsedError ? "true" : "false" ) );
                error_log("Email used " . $email . ": " . ( $mailUsedError ? "true" : "false" ) );
                return false;
            }

            $user = new \Twake\Users\Entity\User();
            $user->setSalt(bin2hex(random_bytes(40)));
            $encoder = new PasswordEncoder();
            $user->setPassword($encoder->encodePassword(bin2hex(random_bytes(40)), $user->getSalt()));
            $user->setUsername($username);
            $user->setMailVerified(true);
            $user->setEmail($email);
            $user->setIdentityProvider("console");
            $user->setIdentityProviderId($userConsoleId);

            $this->em->persist($user);
            $this->em->flush();

            $this->user_service->setUserFromExternalRepository("console", $userConsoleId, $user->getId());
        }

        // Update user names
        $user->setEmail($email);
        $user->setPhone("");
        $user->setFirstName($userDTO["firstName"] ?: ($userDTO["name"] ?: ""));
        $user->setLastName($userDTO["lastName"] ?: "");
        $user->setMailVerified(!!$userDTO["isVerified"]);
        $user->setIdentityProvider("console");
        $user->setIdentityProviderId($userConsoleId);

        $user->setLanguage(@$userDTO["preferences"]["locale"] ?: "en");
        $user->setTimezone(@$userDTO["preferences"]["timezone"] ?: "");

        // Update user picture
        $avatar = $userDTO["avatar"];
        $picture = $avatar["value"] ?: "";
        if($avatar["type"] && $avatar["type"] !== "url"){
            $picture = rtrim($this->endpoint, "/") . "/avatars/" . $avatar["value"];
        }
        $user->setPicture($picture);

        $this->em->persist($user);
        $this->em->flush();

        foreach($roles as $role){
            $companyConsoleCode = $role["targetCode"];
            $level = $role["roleCode"];
            //Double check we created this user in external users repo
            if($companyConsoleCode && $this->user_service->getUserFromExternalRepository("console", $userConsoleId)){
                (new PrepareUpdates($this->app))->addUser($userConsoleId, $companyConsoleCode, $userDTO);
            }
        }

        error_log("Created console user in Twake with success, id: " . $user->getId());

        return $user;

    }
    
    /**
     * Add or update user in a company, the role has the following format:
     * roleCode: "owner" | 'admin' | 'member' | 'guest',
     * status: "active",
     */
    function addUser($userTwakeEntity, $companyTwakeEntity, $roleDTO){
        error_log("addUser with params: ". json_encode([$userTwakeEntity, $companyTwakeEntity, $roleDTO]));

        if($roleDTO["status"] !== "active"){
            return $this->removeUser($userTwakeEntity, $companyTwakeEntity);
        }

        // Add user into the company

        $companyUserRepository = $this->em->getRepository("Twake\Workspaces:GroupUser");
        $companyUserEntity = $companyUserRepository->findOneBy(Array("group" => $companyTwakeEntity, "user" => $userTwakeEntity));

        if(!$companyUserEntity){
            $companyUserEntity = new GroupUser($companyTwakeEntity, $userTwakeEntity);
        }

        $companyUserEntity->setExterne($roleDTO["roleCode"] === "guest"); 
        $companyUserEntity->setLevel(($roleDTO["roleCode"] === "admin" || $roleDTO["roleCode"] === "owner") ? 3 : 0); 
        $role = $roleDTO["roleCode"];
        if($role == "owner") $role = "admin";
        $companyUserEntity->setRole($role);

        $this->em->persist($companyUserEntity);
        $this->em->flush();

        // Check if company has any workspace, if not, create a workspace and invite user in it

        $workspacesRepository = $this->em->getRepository("Twake\Workspaces:Workspace");
        $existingWorkspace = $workspacesRepository->findBy(Array("group" => $companyTwakeEntity));

        if(count($existingWorkspace) < 1){
            $this->app->getServices()->get("app.workspaces")->create($companyTwakeEntity->getDisplayName(), $companyTwakeEntity->getId(), $userTwakeEntity->getId(), true);
        }else{
            foreach($existingWorkspace as $workspace){
                if($workspace->getIsDefault() || count($existingWorkspace) == 1){
                    //Add user in this workspace
                    $this->app->getServices()->get("app.workspace_members")->addMember($workspace->getId(), $userTwakeEntity->getId(), false, null);
                }
            }
        }

        $this->app->getServices()->get("app.workspace_members")->autoAddMemberByNewMail($userTwakeEntity->getEmail(), $userTwakeEntity->getId());

        return true;

    }
    
    function removeUser($userTwakeEntity, $companyTwakeEntity){
        error_log("removeUser with params: ". json_encode([$userTwakeEntity, $companyTwakeEntity]));
        $companyUserRepository = $this->em->getRepository("Twake\Workspaces:GroupUser");
        $companyUserEntity = $companyUserRepository->findOneBy(Array("group" => $companyTwakeEntity, "user" => $userTwakeEntity));
        
        if($companyUserEntity){
            $this->em->remove($companyUserEntity);
            $this->em->flush();
        }

        return true;
    }

}
