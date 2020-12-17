<?php

namespace Twake\Users\Controller\Adapters\Console;

use App\App;
use Twake\Users\Services\PasswordEncoder;

/**
 * This class will do updates in Twake from Twake console
 */
class ApplyUpdates
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
    
    function updateCompany($companyDTO){

        $companyConsoleId = $companyDTO["company_id"];

        $extRepository = $this->em->getRepository("Twake\Workspaces:ExternalGroupRepository");
        $company_link = $extRepository->findOneBy(Array("service_id" => "console", "external_id" => $companyConsoleId));

        $company = null;
        if ($company_link) {
            $twakeCompanyId = $company_link->getGroupId();
            $companyRepository = $this->em->getRepository("Twake\Workspaces:Group");
            $company = $companyRepository->find($twakeCompanyId);
        }
        if(!$company) {
            //Create company
            $company = new Group();

            $this->em->persist($company);
            $this->em->flush();

            $company_link = new ExternalGroupRepository("console", $companyConsoleId, $company->getId());
            $this->em->persist($company_link);
        }

        $company->setName($companyDTO["details"]["code"]);
        $company->setDisplayName($companyDTO["details"]["name"]);

        //TODO: pricing plan
        $company->setPlan($manager->getRepository("Twake\Workspaces:PricingPlan")->findOneBy(Array("id" => "947b6b34-4746-11e9-9034-0242ac120005")));

        $logo = $companyDTO["details"]["logo"];
        if ($logo !== '') {
            $logoEntity = $company->getLogo();
            if(!$logoEntity){
                $logoEntity = new File();
            }
            $logoEntity->setPublicLink($logo);
            $this->em->persist($logoEntity);
            $this->em->flush();
            $company->setLogo($logoEntity);
        }

        $this->em->persist($company);
        $this->em->flush();

        //TODO: realtime update

        return $company;

    }
    
    function removeCompany($companyId){
    }
    
    /**
     * Take a user from api and save it into PHP
     */
    function updateUser($userDTO){

        $roles = $userDTO["roles"];

        $external_id = $userDTO["_id"];

        $email = $userDTO["email"];
        $username = preg_replace("/ +/", "_",
            preg_replace("/[^a-zA-Z0-9]/", "",
                trim(
                    strtolower(
                        $userDTO["firstName"] . " " . $userDTO["lastName"] ?: explode("@", $userDTO["email"])[0]
                    )
                )
            )
        );

        // Create user if needed
        $user = $this->user_service->getUserFromExternalRepository("console", $external_id);
        if (!$user) {
            //Create user on our side

            //Find allowed username / email
            $counter = 1;
            $original_username = $username;
            do {
                $res = $this->user_service->getAvaibleMailPseudo($email, $username);
                if ($res !== true) {
                    if (in_array(-1, $res)) {
                        //Mail used
                        return false;
                    }
                    if (in_array(-2, $res)) {
                        //Username used
                        $username = $original_username . $counter;
                    }
                }
                $counter++;
            } while (!$res);

            $user = new \Twake\Users\Entity\User();
            $user->setSalt(bin2hex(random_bytes(40)));
            $encoder = new PasswordEncoder();
            $user->setPassword($encoder->encodePassword(bin2hex(random_bytes(40)), $user->getSalt()));
            $user->setUsername($username);
            $user->setMailVerified(true);
            $user->setEmail($email); //TODO
            $user->setIdentityProvider("console");

            $this->em->persist($user);
            $this->em->flush();

            $this->user_service->setUserFromExternalRepository("console", $external_id, $user->getId());
        }

        // Update user names
        $user->setEmail($email); //TODO
        $user->setLanguage("en"); //TODO
        $user->setPhone(""); //TODO
        $user->setFirstName($userDTO["firstName"] ?: "");
        $user->setLastName($userDTO["lastName"] ?: "");

        // Update user picture
        $picture = $userDTO["picture"];
        if (($picture && (!$user->getThumbnail() || $user->getThumbnail()->getPublicLink() != $picture)) || ($user->getThumbnail() && !$picture)) {
            if ($user->getThumbnail()) {
                $this->em->remove($user->getThumbnail());
            }
            if($picture){
              $thumbnail = new File();
              $thumbnail->setPublicLink($picture);
              $user->setThumbnail($thumbnail);
              $this->em->persist($thumbnail);
            }else{
              $user->setThumbnail(null);
            }
        }

        $this->em->persist($user);
        $this->em->flush();

        //TODO websocket update

        foreach($roles as $role){
            error_log(json_encode($role));
        }

        return $user;

    }
    
    function addUser($userId, $companyId){
    }
    
    function removeUser($userId, $companyId){
    }

}
