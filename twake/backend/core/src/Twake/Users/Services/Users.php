<?php

namespace Twake\Users\Services;

use App\App;

/**
 * This service is responsible for subscribtions, unsubscribtions, request for new password
 */
class Users
{

    private $em;
    private $list_users = Array("users" => Array(), "scroll_id" => "");


    public function __construct(App $app)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
        $this->string_cleaner = $app->getServices()->get("app.string_cleaner");
    }

    public function search($options = Array(), $entity = false){
        $res = $this->searchWithES($options, $entity);
        if(!isset($res["users"]) || count($res["users"]) === 0){
                $res = $this->searchWithDB($options, $entity);
        }
        return $res;
    }

    public function searchWithDB($options = Array(), $entity = false)
    {
        $name = $options["name"];

        $scope = $options["scope"] ?: "all";
        if($scope !== "group" || $scope !== "workspace") $scope = "group";

        $usersArray = [];
        $usersEntities = [];

        $offset = null;
        $limit = 100;
        $iteration = 0;

        while(count($usersArray) < 5 && $iteration < 10){
            $iteration++;

            $users = [];
            if($scope == "workspace"){
                $workspace_id = $options["workspace_id"];

                $repo = $this->em->getRepository("Twake\Workspaces:WorkspaceUser");
                $links = $repo->findBy(["workspace_id" => $workspace_id], null, $limit, $offset);

                foreach($links as $link){
                    $users[] = $link->getUser($this->em);
                    $offset = $link->getUserId();
                }

            }elseif($scope == "group"){
                $group_id = $options["group_id"];

                $repo = $this->em->getRepository("Twake\Workspaces:GroupUser");
                $links = $repo->findBy(["group" => $group_id], null, $limit, $offset);

                foreach($links as $link){
                    $users[] = $link->getUser();
                    $offset = $link->getUser()->getId();
                }
                
            }

            foreach($users as $user){
                if($user){

                    $match = false;
                    foreach($user->getAsArray() as $key => $value){
                        if(in_array($key, ["username", "firstname", "lastname", "email"])){
                            foreach(explode(" ", $name) as $word){
                                if(strpos(strtolower($value), strtolower($word)) !== false){
                                    $match = true;
                                }
                            }
                        }
                    }

                    if($match){
                        $usersArray[] = [$user->getAsArray(), 0];
                        $usersEntities[] = [$user, 0];
                    }
                }
            }

            if(count($users) < $limit){
                break;
            }

        }

        return ["users" => $entity ? $usersEntities : $usersArray, "scroll_id" => ""];

    }

    public function searchWithES($options = Array(), $entity = false)
    {

        $name = $options["name"];

        $scope = $options["scope"] ?: "all";
        if($scope !== "group" || $scope !== "workspace") $scope = "group";
        $workspace_id = $options["workspace_id"];
        $group_id = $options["group_id"];
        
        $should = Array();

        if (isset($name)) {
            $should[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "firstname" => ".*" . $name . ".*"
                        )
                    )
                )
            );

            $should[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "email" => $name . ".*"
                        )
                    )
                )
            );

            $should[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "lastname" => ".*" . $name . ".*"
                        )
                    )
                )
            );

            $should[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "username" => ".*" . $name . ".*"
                        )
                    )
                )
            );
        }

        $match = null;

        if($scope == "workspace"){
            $match = Array(
                "workspaces_id" => $workspace_id
            );
        }

        if($scope == "group"){
            $match = Array(
                "groups_id" => $group_id
            );
        }

        $search_bool = Array(
            "should" => $should,
            "minimum_should_match" => 1
        );
        if($match){
            $search_bool["filter"] = [
                "match" => $match
            ];
        }

        $options = Array(
            "repository" => "Twake\Users:User",
            "index" => "users",
            "size" => 10,
            "query" => Array(
                "bool" => Array(
                    "must" => Array(
                        "bool" => $search_bool
                    )
                )
            ),
            "sort" => Array(
                "creation_date" => Array(
                    "order" => "desc"
                )
            )
        );


        // search in ES
        $result = $this->em->es_search($options);

        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        if($scope === "all"){
            $userRepository = $this->em->getRepository("Twake\Users:User");
            $user = $userRepository->findOneBy(Array("usernamecanonical" => strtolower($name)));

            if ($user) {
                $this->list_users["users"][] = Array($entity ? $user : $user->getAsArray(), 0);
            }
        }

        //on traite les données recu d'Elasticsearch
        foreach ($result["result"] as $user) {
            if($user[0]){
                $this->list_users["users"][] = Array($entity ? $user[0] : $user[0]->getAsArray(), $user[1][0]);
            }
        }

        $this->list_users["scroll_id"] = $scroll_id;

        return $this->list_users ?: null;
    }

    public function completeUserWithCompanies($user, $requester = null)
    {
        if(is_string($requester)){
            return $user;
        }
        
        $membersRepository = $this->em->getRepository("Twake\Workspaces:GroupUser");
        $companies = $membersRepository->findBy(Array("user" => $user["id"]));
        $user["companies"] = [];

        foreach($companies as $companyMember){
            if($requester && !$membersRepository->findBy(Array("user" => $requester, "group" => $companyMember->getGroup())) ){
                continue;
            }
            $user["companies"][] = [
                "role" => $companyMember->getRole() === null ? "member" : $companyMember->getRole(),
                "status" => "active",
                "company" => [
                    "id" => $companyMember->getGroup()->getId()
                ]
            ];
        }

        return $user;
    }

    public function getById($id, $entity = false)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->find($id);
        if ($user) {
            return $entity ? $user : $user->getAsArray();
        }
        return false;
    }

    public function getByEmail($email, $entity = false)
    {
        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("emailcanonical" => $this->string_cleaner->simplifyMail($email)));
        if ($user) {
            return $entity ? $user : $user->getAsArray();
        }
        return false;
    }
}
