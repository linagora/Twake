<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use WebsiteApi\GlobalSearchBundle\Entity\Bloc;
use WebsiteApi\DiscussionBundle\Entity\Message;

class Blocmessage

{
    private $doctrine;

    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function search($words,$channels){

        $final_words = Array();
        foreach($words as $word){
            if(strlen($word) > 3) {
                $final_words[] = $word;
            }
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
                            "bool" => Array(
                                "should" => Array(
                                    $should_channels
                                ),
                                "minimum_should_match" => 1,
                                "must" => Array(
                                    "bool" => Array(
                                        "should" => Array(
                                            $terms
                                        ),
                                        "minimum_should_match" => 1
                                    )
                                )
                            )
                        )
                    )
                )
            );

            $id_message=Array();

            // search in ES
            $result = $this->doctrine->es_search($options);
            array_slice($result, 0, 5);
//            error_log(print_r($result,true));

            // on cherche dans le bloc en cours de construction de tout les channels demandés
            foreach($channels as $channel) {
                $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("channel_id" => $channel));
                $compt = 0;
                if (isset($lastbloc)) {
                    foreach ($lastbloc->getContent() as $content) {
                        foreach ($words as $word) {
                            if (strpos($content, $word) !== false) {
                                if (in_array($lastbloc->getMessages()[$compt], $id_message) == false) {
                                    $id_message[] = $lastbloc->getMessages()[$compt];
                                    //on peut penser a rajouter un break
                                }
                            }

                        }
                        $compt++;
                        //var_dump($compt);
                    }
                }
            }

            //on traite les données recu d'Elasticsearch


            foreach ($result as $bloc) {
                $content = $bloc->getContent();
                $compt = 0;
                foreach ($content as $phrase) {
                    foreach ($words as $word) {
                        if (strpos($phrase, $word) !== false) {
                            if (in_array($bloc->getMessages()[$compt], $id_message) == false) {
                                $id_message[] = $bloc->getMessages()[$compt];
                            }
                        }
                    }
                    $compt++;
                }
            }
            // var_dump($id_message);
            $result = Array(); //content all the message object
            foreach ($id_message as $id) {
                $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $id));
                $channel_entity = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message->getChannelId()));
                $result[] = Array("message" => $message->getAsArray(), "channel"=> $channel_entity);
            }
        }

    return $result ?: null;

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

//
        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findBy(Array());
        foreach($lastbloc as $bloc){
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