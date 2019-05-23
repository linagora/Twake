<?php


namespace WebsiteApi\GlobalSearchBundle\Services;


class AdvancedSearch
{
    private $doctrine;
    private $blocservice;
    private $fileservice;
    private $workspaceservice;
    private $globalresult;

    public function __construct($doctrine, $blocservice, $fileservice, $workspaceservice)
    {
        $this->doctrine = $doctrine;
        $this->blocservice = $blocservice;
        $this->fileservice = $fileservice;
        $this->workspaceservice = $workspaceservice;

    }

    public function AdvancedSearch($current_user_id,$group_id)
    {

        //$words = Array("appli", "données", "Thomas", "General", "Space");
        $words = Array("seule");
        $this->globalresult = Array();
        $workspaces = $this->workspaceservice->search($group_id);
        //REVOIR LA PERF C EST PAS OUF LA SUREMENT
        foreach ($workspaces as $workspace) {
            // DOMMAGE D AVOIR L OBJET WP ET DE REFAIRE UN HIT DE BASE CAR ON A PLUS QU UN GET AS ARRAY
            $workspace_user = $this->doctrine->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace["id"]));
            $temp = $workspace_user->getMembers();
            foreach ($temp as $member){
                $user = $member->getUser();
                if($user->getAsArray()["id"] == $current_user_id) // on a acces au wp
                {
                    //MODIFIER ICI POUR NE PAS A FAIRE TOUS CA MAIS JUSTE RECHERCHER LES MESSAGE DE SES WP
                    // A TON ACCES A TOUS LES CHANNELS D UN WP? JE CROIS QUE NON SI OUI RETIRER LA BOUCLE SUR LES CHAN
                    //PENSEZ A VERIF SI ON A ACCES AU CHAN OU PAS

                    // V1 QUI MARCHE
//                    $channels= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findBy(Array("direct"=>false, "original_workspace_id" => $workspace["id"]));
//                    foreach ($channels as $channel){
//                        if($channel->getAsArray()["application"] == false && $channel->getAsArray()["direct"] == false) {
//                            //remplacer l id du channel par l id de tout les channels du workspace
//                            $messages = $this->blocservice->search($words, $workspace["id"], $channel->getAsArray()["id"]);
//                            if (isset($messages))
//                            {
//                                foreach ($messages as $message) {
//                                    //var_dump($message);
//                                    $this->globalresult[] = Array("message" => $message, "workspace" => $workspace, "channel" => $channel);
//                                }
//                            }
//                        }
//                    }

                    //V2 AVEC LA VERIF DE L ACCES A LA DONNEE APRES L AVOIR RECU
                    $messages = $this->blocservice->search($words, $workspace["id"]);
                    if (isset($messages))
                        {
                            foreach ($messages as $message) {
                                $channel= $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $message["channel_id"]));
                                if(in_array($current_user_id,$channel->getAsArray()["members"]))
                                {
                                    $this->globalresult[] = Array("message" => $message, "workspace" => $workspace, "channel" => $channel);
                                }
                            }
                        }
                }
                }
        }



//        $files = $this->fileservice->search($words);
//        foreach ($files as $file){
//            $globalresult[]=Array( $file["id"] => "file");
//        }
        //var_dump("cc");
        return $this->globalresult;
    }

}