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

    public function search($options = Array())
    {
        $name = $options["name"];
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


        $options = Array(
            "repository" => "Twake\Users:User",
            "index" => "users",
            "size" => 10,
            "query" => Array(
                "bool" => Array(
                    "must" => Array(
                        "bool" => Array(
                            "should" => $should,
                            "minimum_should_match" => 1
                        )
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

        $userRepository = $this->em->getRepository("Twake\Users:User");
        $user = $userRepository->findOneBy(Array("usernamecanonical" => strtolower($name)));

        if ($user) {
            $this->list_users["users"][] = $user;
        }

        //on traite les données recu d'Elasticsearch
        foreach ($result["result"] as $user) {
            //var_dump($file->getAsArray());
            $this->list_users["users"][] = Array($user[0]->getAsArray(), $user[1][0]);;
        }

        $this->list_users["scroll_id"] = $scroll_id;

        return $this->list_users ?: null;
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

    public function searchUsersByUsername($username, $restrictions, $groupId, $workspaceId)
    {
        if ($username == "")
            return "empty username";
        $userRepository = $this->em->getRepository("TwakeUsersBundle:User");

        $users = $userRepository->findByName($username);

        if ($restrictions == "all") {
            return $users;
        }
        $res = [];
        if ($restrictions == "group") {
            $groupUserRepository = $this->em->getRepository("TwakeWorkspacesBundle:GroupUser");

            foreach ($users as $user) {
                $groupuser = $groupUserRepository->findOneBy(Array("user" => $user->getId(), "group" => $groupId));
                if ($groupuser) {
                    $res[] = $user;
                }
            }
        }

        if ($restrictions == "workspace") {
            $workspaceUsers = $this->em->getRepository("TwakeWorkspacesBundle:WorkspaceUser");

            foreach ($users as $user) {
                $workspaceUser = $workspaceUsers->findOneBy(Array("workspace" => $workspaceId, "user" => $user));
                if ($workspaceUser) {
                    $res[] = $user;
                }
            }
        }

        return $res;

    }
}
