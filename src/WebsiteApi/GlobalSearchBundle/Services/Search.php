<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\GlobalSearchBundle\Entity\Bloc;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\DriveBundle\Entity\DriveFile;


class Search
{
    private $doctrine;
    private $blocservice;
    private $fileservice;
    private $userservice;
    private $applicationservice;

    public function __construct($doctrine, $blocservice, $fileservice, $userservice, $applicationservice)
    {
        $this->doctrine = $doctrine;
        $this->blocservice = $blocservice;
        $this->fileservice = $fileservice;
        $this->userservice = $userservice;
        $this->applicationservice = $applicationservice;
    }

    public function GlobalSearch(){

        $words = Array("appli","données","Thomas");
        $globalresult = Array();
//        $messages = $this->blocservice->SearchMessage($words);
//        foreach ($messages as $message){
//            $globalresult[]=Array( $message->getId()."" => "message");
//        }
//        $files = $this->fileservice->SearchFile($words);
//        foreach ($files as $file){
//            $globalresult[]=Array( $file->getId()."" => "file");
//        }
//        $users = $this->userservice->search("thomas");
//
//        foreach ($users as $user){
//            $globalresult[]=Array( $user["id"] => "user");
//        }
        
//
        var_dump($globalresult);

    }

}