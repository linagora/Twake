<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

class Event
{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function TestSearch()
    {
        $options = Array(
            "repository" => "TwakeGlobalSearchBundle:User",
            "index" => "store",
            "query" => Array(
                "match" => Array(
                    "email" => "bibi@gmail.fr"
                )
            )
        );


        $users = $this->doctrine->es_search($options);
        $result = [];
        foreach ($users as $user) {
            $result[] = $user->getAsArray();
        }
        return $result;
    }

}