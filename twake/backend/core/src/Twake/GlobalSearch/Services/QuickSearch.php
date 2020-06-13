<?php

namespace Twake\GlobalSearch\Services;

use App\App;

use Twake\Core\Services\StringCleaner;

class QuickSearch
{
    private $doctrine;
    private $userservice;
    private $workspaceservice;
    private $channelservice;
    private $fileservice;
    private $memberservice;

    //liste final de résultats
    private $globalresult;

    //va stocker les résultat non prioritaire séparé par type
    private $fileresult;
    private $channelresult;

    //va stocker les résultat prioritaire séparé par type
    private $priofileresult;
    private $priochannelresult;

    private $history;

    private $workspace_prio;


    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->userservice = $app->getServices()->get("app.users");
        $this->workspaceservice = $app->getServices()->get("app.workspaces");
        $this->channelservice = $app->getServices()->get("app.channels.channels_system");
        $this->fileservice = $app->getServices()->get("globalsearch.advancedfile");
        $this->memberservice = $app->getServices()->get("app.workspace_members");
    }

    private static function cmpfile($file1, $file2)
    { //permet d'obtenir la list des fichier par liste de pertinence
        if ($file1["score"] == $file2["score"]) {
            return 0;
        }
        return ($file1["score"] > $file2["score"]) ? -1 : 1;
    }

    private static function cmpchannel($channel1, $channel2)
    { //permet d'obtenir la list des fichier par liste de pertinence
        if ($channel1["channel"]["last_activity"] == $channel2["channel"]["last_activity"]) {
            return 0;
        }
        return ($channel1["channel"]["last_activity"] > $channel2["channel"]["last_activity"]) ? -1 : 1;
    }

    public function AddAllChannels($workspace)
    {

        $channels = $this->doctrine->getRepository("Twake\Channels:Channel")->findBy(Array("direct" => false, "original_workspace_id" => $workspace["id"]));
        foreach ($channels as $channel) {
            if ($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false) {
                $channel = $channel->getAsArray();
                if (isset($this->workspace_prio) && $this->workspace_prio == $workspace["id"]) {
                    $this->priochannelresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
                } else {
                    $this->channelresult[] = Array("type" => "channel", "channel" => $channel, "workspace" => $workspace);
                }
                //$this->history->addSearch(Array("id" => $channel["id"],"type"=> "file", "compteur" => 0));
            }
        }
    }

    public function QuickSearch($current_user_id, $words, $group_id = null, $workspace_prio = null)
    {

        $this->workspace_prio = $workspace_prio;
        //$this->workspace_prio = "d975075e-6028-11e9-b206-0242ac120005";
        //$words = Array("Romaric",'justin');
        $st = new StringCleaner();
        $words = $st->simplifyInArray($words);
        $this->globalresult = Array();

        $this->fileresult = Array();
        $this->priofileresult = Array();
        $this->channelresult = Array();
        $this->priochannelresult = Array();

//        $this->history = $this->doctrine->getRepository("Twake\GlobalSearch:SearchHistory")->findOneBy(Array("user_id" => $current_user_id));
//        if(!isset($this->history)){
//            $this->history = new SearchHistory($current_user_id,Array());
//        }

        $workspaces_acces = $this->memberservice->getWorkspaces($current_user_id);
        $workspaces = Array(); //liste des workspace dont on a accces;
        foreach ($workspaces_acces as $workspace_obj) {
            $value = $workspace_obj["workspace"]->getAsArray();
            if (isset($group_id) && !(in_array($value, $workspaces)) && $value["group"]["id"] == $group_id) {
                $workspaces[$value["id"]] = $value;
            } elseif (!isset($group_id) && !(in_array($value, $workspaces))) {
                $workspaces[$value["id"]] = $value;
            }
        }

        $user = $this->doctrine->getRepository("Twake\Users:User")->findOneBy(Array("id" => $current_user_id));


        $this->SearchFile($current_user_id, $words, $workspaces);
        $this->SearchInWorkspace($words, $workspaces, $current_user_id);
        $this->SearchPrivateChannel($words, $user->getUsername(), $current_user_id);


//        usort($this->fileresult,array($this,'cmpfile')); //on a meme plus besoin de trier ES le fait pour nous normalement
//        usort($this->priofileresult,array($this,'cmpfile'));
//        usort($this->priochannelresult,array($this,'cmpchannel'));
        usort($this->channelresult, array($this, 'cmpchannel'));


//        une fois toutes les données récupéré on construit le tableau de résltat final comme suit:
//        - resultat prio
//        - fichier prio
//        - channel
//        - fichier

        $this->globalresult = array_merge($this->globalresult, $this->priochannelresult);
        $this->globalresult = array_merge($this->globalresult, $this->priofileresult);
        $this->globalresult = array_merge($this->globalresult, $this->channelresult);
        $this->globalresult = array_merge($this->globalresult, $this->fileresult);


//        $this->history = $this->doctrine->getRepository("Twake\GlobalSearch:SearchHistory")->findOneBy(Array("user_id" => $current_user_id));
//        $this->doctrine->persist($this->history); //rajouter if isset history
//        $this->doctrine->flush();

//        $channels= $this->doctrine->getRepository("Twake\Channels:Channel")->findBy(Array());
//        foreach ($channels as $channel){
//            if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == true) {
//            }
//        }

//
//        $workspaces = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findBy(Array("id" => "0f34eff8-48af-11e9-9dd1-0242ac120005"));
//        foreach ($workspaces as $workspace) {
//        }

//        $files = $this->doctrine->getRepository("Twake\Drive:DriveFile")->findBy(Array());
//        foreach ($files as $file){
//            $this->doctrine->remove($file);
//        }
//        $this->doctrine->flush();

        return $this->globalresult;
    }

    public function SearchFile($current_user_id, $words, $workspaces)
    {

        $options = Array();
        $options["title"] = join(" ", $words);

        $files = $this->fileservice->AdvancedFile($current_user_id, $options, $workspaces);
        error_log(json_encode($files));
        foreach ($files["results"] as $file) {
            if (isset($this->workspace_prio) && $this->workspace_prio == $file["file"]["workspace_id"]) {
                $this->priofileresult[] = $file;
            } else {
                $this->fileresult[] = $file;
            }
            //$this->history->addSearch(Array("id" => $file[0]["id"],"type"=> "file", "compteur" => 0));
        }
    }

    public function SearchInWorkspace($words, $workspaces, $current_user_id)
    {
        $channels = $this->channelservice->search($words, $workspaces, $current_user_id); // search channel in a workspace
        foreach ($channels as $channel) {
            if (in_array($current_user_id, $channel[0]["members"]) || in_array($current_user_id, $channel[0]["ext_members"])) {
                if (isset($this->workspace_prio) && $this->workspace_prio == $channel[0]["original_workspace"]) {
                    $this->priochannelresult[] = Array("type" => "channel", "channel" => $channel[0], "last_activity" => $channel[1], "workspace" => $workspaces[$channel[0]["original_workspace"]]);
                } else {
                    $this->channelresult[] = Array("type" => "channel", "channel" => $channel[0], "last_activity" => $channel[1], "workspace" => $workspaces[$channel[0]["original_workspace"]]);
                }
                //$this->history->addSearch(Array("id" => $channel["id"],"type"=> "file", "compteur" => 0));
            }
        }
    }

    public function SearchPrivateChannel($words, $name, $current_user_id)
    {
        $words[] = $name;
        $channels = $this->channelservice->searchprivate($words, $current_user_id); // search channel in a workspace
        foreach ($channels as $channel) {
            $this->channelresult[] = Array("type" => "channel", "channel" => $channel[0], "last_activity" => $channel[1]);
            //$this->history->addSearch(Array("id" => $channel["id"],"type"=> "file", "compteur" => 0));
        }

    }

}