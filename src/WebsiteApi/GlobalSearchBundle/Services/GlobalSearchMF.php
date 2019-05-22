<?php


namespace WebsiteApi\GlobalSearchBundle\Services;


class GlobalSearchMF
{
    private $doctrine;
    private $blocservice;
    private $fileservice;


    public function __construct($doctrine, $blocservice, $fileservice)
    {
        $this->doctrine = $doctrine;
        $this->blocservice = $blocservice;
        $this->fileservice = $fileservice;

    }

    public function GlobalSearch()
    {

        $words = Array("appli", "données", "Thomas", "General", "Space");
        $globalresult = Array();

        $messages = $this->blocservice->search($words);
        foreach ($messages as $message){
            $globalresult[]=Array( $message["id"] => "message");
        }

        $files = $this->fileservice->search($words);
        foreach ($files as $file){
            $globalresult[]=Array( $file["id"] => "file");
        }

        return $globalresult;
    }

}