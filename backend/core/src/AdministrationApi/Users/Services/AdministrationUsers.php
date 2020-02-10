<?php


namespace AdministrationApi\Users\Services;


class AdministrationUsers
{

    private $em;

    private $list_user = Array("users" => Array(), "scroll_id" => "");

    public function __construct($em)
    {
        $this->em = $app->getServices()->get("app.twake_doctrine");
    }

    public function getAllUsers($options)
    {

        $options = Array(
            "repository" => "Twake\Users:User",
            "index" => "users",
            "scroll_id" => $options["scroll_id"],
            "size" => 10,
            "query" => Array(
                "match_all" => (object)[]
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

        //on traite les données recu d'Elasticsearch
        foreach ($result["result"] as $user) {
            $user_tab = $user[0]->getAsArray();
            $user_tab['mail'] = $this->getUserMails($user[0])[0];
            $user_tab['phone_number'] = $user[0]->getPhone();
            $user_tab['creation_date'] = $user[0]->getCreationDate();

            $this->list_user["users"][] = Array($user_tab, $user[1][0]);;
        }
        $this->list_user["scroll_id"] = $scroll_id;

        return $this->list_user ?: null;
    }

    public function getUserMails($user)
    {
        $mailsRepository = $this->em->getRepository("Twake\Users:Mail");

        $mails_tab = $mailsRepository->findBy(Array("user" => $user));

        $mails = array();

        foreach ($mails_tab as $mail) {
            $mails[] = $mail->getMail();
        }

        return $mails;
    }

    public function getOneUser($user_id)
    {
        try {
            $usersRepository = $this->em->getRepository("Twake\Users:User");

            $user = $usersRepository->find($user_id);

            return $user;

        } catch (Exception $e) {
            return "Error";
        }
    }

    public function getUserDevices($user)
    {
        $devicesRepository = $this->em->getRepository("Twake\Users:Device");

        $devices_tab = $devicesRepository->findBy(Array("user" => $user));

        $devices = array();

        foreach ($devices_tab as $device) {
            $devices[] = $device->getAsArray();
        }

        return $devices;
    }

    public function getUserWorkspaces($user)
    {
        $workspacesRepository = $this->em->getRepository("Twake\Workspaces:WorkspaceUser");

        $workspaces_tab = $workspacesRepository->findBy(Array("user" => $user));

        $workspaces = array();

        foreach ($workspaces_tab as $workspace) {
            $workspaces[] = $workspace->getWorkspace()->getAsArray();
        }

        return $workspaces;
    }

    public function getUserGroups($user)
    {
        $groupsRepository = $this->em->getRepository("Twake\Workspaces:GroupUser");

        $groups_tab = $groupsRepository->findBy(Array("user" => $user));

        $groups = array();

        foreach ($groups_tab as $group) {
            $groups[] = $group->getGroup()->getAsArray();
        }

        return $groups;
    }

    public function findUserById($id)
    {

        $usersRepository = $this->em->getRepository("Twake\Users:User");

        $users = $usersRepository->findBy(Array("id" => $id));

        $rep = array("users" => array(), "scroll_id" => "");

        if (count($users) >= 1) {

            foreach ($users as $user) {
                $user_tab = $user->getAsArray();
                $user_tab['mail'] = $user->getEmail();
                $rep["users"][] = array($user_tab, null);
            }
        }

        return $rep;

    }

    public function getUserbyMail($options)
    {

        if (isset($options["mail"])) {
            $mail = $options["mail"];

            //var_dump("passage");

            $options = Array(
                "repository" => "Twake\Users:Mail",
                "index" => "mail",
                "size" => 10,
                "query" => Array(
                    "bool" => Array(
                        "should" => Array(
                            "bool" => Array(
                                "filter" => Array(
                                    "regexp" => Array(
                                        "mail" => ".*" . $mail . ".*"
                                    )
                                )
                            )
                        )
                    )
                ),
            );
        }

        // search in ES
        $result = $this->em->es_search($options);

        array_slice($result["result"], 0, 5);

        $scroll_id = $result["scroll_id"];

        //on traite les données recu d'Elasticsearch
        foreach ($result["result"] as $mail) {
            $mail = $mail[0];
            $user = $mail->getUser();
            $user_tab = $user->getAsArray();
            $user_tab['mail'] = $this->getUserMails($user)[0];
            $user_tab['phone_number'] = $user->getPhone();
            $user_tab['creation_date'] = $user->getCreationDate();

            $this->list_user["users"][] = array($user_tab, null);
        }
        $this->list_user["scroll_id"] = $scroll_id;

        return $this->list_user ?: null;
    }

}
