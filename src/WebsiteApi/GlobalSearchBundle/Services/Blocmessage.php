<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use Tests\UsersBundle\Error200Test;
use WebsiteApi\GlobalSearchBundle\Entity\Bloc;
use WebsiteApi\DiscussionBundle\Entity\Message;

class Blocmessage

{
    private $doctrine;
    private $doublon_id = Array();


    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function verif_valid($message_id_in_bloc, $options, $list_message){

        //todo: AJOUTER LES FILTRES SUR LES DATES
        $valid = true;
        $message_bdd = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message_id_in_bloc));
//        error_log(print_r('date before : ' . $options["date_before"],true));
//        error_log(print_r('date after : ' . $options["date_after"],true));
//        error_log(print_r('date message : ' . $message_bdd->getCreationDate()->format('Y-m-d') ,true));

        if(isset($options["date_before"]) && ($message_bdd->getCreationDate()->format('Y-m-d') > $options["date_before"])){
            $valid = false;
        }
        if(isset($options["date_after"]) && ($message_bdd->getCreationDate()->format('Y-m-d') < $options["date_after"])){
            $valid = false;
        }

        if ($valid && !in_array($message_id_in_bloc, $this->doublon_id)) {
            $this->doublon_id[] = $message_id_in_bloc;
            $channel_entity = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $message_bdd->getChannelId()));
            $list_message[] = Array("message" => $message_bdd->getAsArray(), "channel"=> $channel_entity->getAsArray());
            //error_log("MESSAGE DANS RESULT");
            //error_log(print_r($result,true));
        }

        return $list_message;

    }

    public function search($options,$channels){
        $final_words = Array();
        $options_save = $options;
        $now = new \DateTime();
        //$now = $now["date"];
        $now = $now->format('Y-m-d');
        $before = Array(
            "bool" => Array(
                "filter" => Array(
                    "range" => Array(
                        "date_first" =>Array(
                            "lte" => $now
                        )
                    )
                )
            )
        );
        $after = Array(
            "bool" => Array(
                "filter" => Array(
                    "range" => Array(
                        "date_last" =>Array(
                            "gte" => "2000-01-01"
                        )
                    )
                )
            )
        );


        foreach($options["words"] as $word){
            if(strlen($word) > 3) {
                $final_words[] = strtolower($word);
            }
        }
        if(isset($options["date_before"])){
            $before = Array(
                "bool" => Array(
                    "filter" => Array(
                        "range" => Array(
                            "date_first" =>Array(
                                "lte" => $options["date_before"]
                            )
                        )
                    )
                )
            );
        }

        if(isset($options["date_after"])){
            $after = Array(
                "bool" => Array(
                    "filter" => Array(
                        "range" => Array(
                            "date_last" =>Array(
                                "gte" => $options["date_after"]
                            )
                        )
                    )
                )
            );
        }

        if(isset($final_words) && $final_words != Array()){
            $terms = Array();
            foreach ($final_words as $word){
                $terms[] = Array(
                    "bool" => Array(
                        "filter" => Array(
                            "regexp" => Array(
                                "content" => ".*" . $word . ".*"
                            )
                        )
                    )
                );
            }

            $should_channels = Array();
            foreach($channels as $channel) {
                $should_channels[] = Array(
                    "match_phrase" => Array(
                        "channel_id" => $channel
                    )
                );
            }

            $options = Array(
                "repository" => "TwakeGlobalSearchBundle:Bloc",
                "index" => "message_bloc",
                "query" => Array(
                    "bool" => Array(
                        "must" => Array(
                            Array(
                                "bool" => Array(
                                    "should" => Array(
                                        $should_channels
                                    ),
                                    "minimum_should_match" => 1,
                                )
                            ),
                            Array(
                                "bool" => Array(
                                    "should" => Array(
                                        $terms
                                    ),
                                    "minimum_should_match" => 1
                                )
                            ),
                            Array(
                                $before
                            ),
                            Array(
                                $after
                            ),
                        )
                    )
                )
            );

            //var_dump($options);

            $list_message=Array();

            // search in ES
            $result = $this->doctrine->es_search($options);
            array_slice($result["result"], 0, 5);


            // on cherche dans le bloc en cours de construction de tout les channels demandés
            foreach($channels as $channel) {
                $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("channel_id" => $channel));
                $compt = 0;
                if (isset($lastbloc) && $lastbloc->getLock() == false) {
                    foreach ($lastbloc->getContent() as $content) {
                        foreach ($final_words as $word) {
                            if (strpos(strtolower($content), strtolower($word)) !== false) {
                                $message_id_in_bloc = $lastbloc->getMessages()[$compt];
                                $list_message = $this->verif_valid($message_id_in_bloc, $options_save,$list_message);
                            }

                        }
                        $compt++;
                        //var_dump($compt);
                    }
                }
            }

            //on traite les données recu d'Elasticsearch

            foreach ($result["result"] as $bloc) {
                $content = $bloc->getContent();
//                error_log(print_r("nombre de resultat : " . count($result),true));
//                error_log(print_r($bloc,true));
                $compt = 0;
                foreach ($content as $phrase) {
                    foreach ($final_words as $word) {
                        if (strpos(strtolower($phrase), strtolower($word)) !== false) {
                            $message_id_in_bloc = $bloc->getMessages()[$compt];
                            $list_message = $this->verif_valid($message_id_in_bloc, $options_save, $list_message);
                        }
                    }
                    $compt++;
                }
            }
            error_log(print_r("nombre de resultat : " . count($list_message),true));
        }

    return $list_message ?: null;

    }


    public function TestMessage()
    {
//        $messagetest="je suis seulement dans la base de données";
//        //$messagetest="je commence a voir faim ca veut dire que je vais mieux";
//        $message = new Message("e5d085aa-6028-11e9-922a-0242ac120005","");
//        $message->setContent($messagetest);
//        $this->doctrine->persist($message);
//        $this->doctrine->flush();
//        $this->indexbloc($message,"d975075e-6028-11e9-b206-0242ac120005","e5d085aa-6028-11e9-922a-0242ac120005");

        //$lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("workspace_id" => "d975075e-6028-11e9-b206-0242ac120005", "channel_id" => "e5d085aa-6028-11e9-922a-0242ac120005"));
//        var_dump("BLOC A LA FIN");
//        var_dump($lastbloc);



        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findBy(Array());
        foreach($lastbloc as $bloc){
//            var_dump($bloc->getAsArray());
            $this->doctrine->remove($bloc);
            $this->doctrine->flush();
        }

//        $words = Array("commence","données");
//        $this->search($words);

//        $users = $this->doctrine->getRepository("TwakeUsersBundle:User")->findBy(Array());
//        foreach ($users as $user) {
//            var_dump($user->getUsername());
//        }
//        $channel = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => "db2c2b9e-c357-11e9-933e-0242ac1d0005"));
//        $channel_id = $channel->getId();
//        var_dump($channel_id);
//        $lastblocs = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findBy(Array());
//        foreach ($lastblocs as $lastbloc){
//            var_dump($lastbloc->getAsArray());
//        }
        //$this->Updateinbloc($message);

    }

}