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

    public function SearchInBloc($current_user_id,$options,$channels){
        $channel_acces = Array();
        //verif l acces au channel


        foreach ($channels as $channel){
            $member = $this->doctrine->getRepository("TwakeChannelsBundle:ChannelMember")->findOneBy(Array("direct" => false, "user_id"=> $current_user_id, "channel_id" => $channel));
            if(isset($member)){
                $channel_acces[] = $channel;
            }
        }
        //on regarde avant l'acces pour ne faire qu'une requete sur ES et pour pouvoir profitier de l'ordonnocement par pertinence
        if(isset($channel_acces) && $channel_acces != Array()){

            $messages = $this->blocservice->search($options, $channel_acces);
            if (isset($messages))
            {
                foreach ($messages as $message) {
                    $this->globalresult[] = Array("message" => $message);
                }
            }
        }
    }

    public function AdvancedSearch($current_user_id,$options,$channels)
    {

        $this->globalresult = Array();

        $this->SearchInBloc($current_user_id,$options,$channels);
        //error_log(print_r("taille result : " . count($this->globalresult),true));
        //error_log(print_r($this->globalresult,true));
//        $files = $this->fileservice->search($words);
//        foreach ($files as $file){
//            $globalresult[]=Array( $file["id"] => "file");
//        }
        return $this->globalresult;
    }

}