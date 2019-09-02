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
        $valid = true;
        //var_dump($options);
        $message_bdd = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message_id_in_bloc));
//        var_dump('date before : ' . $options["date_before"]);
//        var_dump('date after : ' . $options["date_after"]);
//        var_dump('date message : ' . $message_bdd->getCreationDate()->format('Y-m-d'));

        if($valid && isset($options["sender"])){
            if($message_bdd->getSender()->getId()."" != $options["sender"]){
                $valid = false;
            }
        }
        if($valid && isset($options["date_before"]) && ($message_bdd->getCreationDate()->format('Y-m-d') > $options["date_before"])){
            $valid = false;
        }
        if($valid && isset($options["date_after"]) && ($message_bdd->getCreationDate()->format('Y-m-d') < $options["date_after"])){
            $valid = false;
        }

        if($valid && isset($options["mentions"])){
            $mentions = Array();
            if(is_array($message_bdd->getContent()["prepared"][0])){
                foreach ($message_bdd->getContent()["prepared"][0] as $elem){
                    if(is_array($elem)){
                        $id = explode(":",$elem["content"])[1];
                        //error_log(print_r($id,true));
                        $mentions[] = $id;
                    }
                }
                $mentions = array_unique($mentions);
            }

//            var_dump(array_intersect($options["mentions"], $mentions));
            if(!array_intersect($options["mentions"], $mentions) == $options["mentions"]){
                $valid = false;
            }
        }

        if($valid && isset($options["reactions"])){
            $react_search = true;
            $i = 0;
            // on parcours toute les reactions saisites
            $reaction = $message_bdd->getReactions();
            if(isset($reaction)) {
                while ($react_search && $i < count($options["reactions"])) {
                    //version OU il faut enleveer react_search pour tous check voir vérifier si on pas deja assez trouvé pour s'arreter la
                    $trouve = false;
                    //$trouve = 0;
                    //var_dump($options["reactions"]);
                    //var_dump($message_bdd->getReactions());
                    foreach (array_keys($message_bdd->getReactions()) as $reaction) {
                        //var_dump($reaction);
                        //var_dump($options["reactions"][$i]);
                        if (strpos(strtolower($reaction), strtolower($options["reactions"][$i])) !== false) {
                            //var_dump("match");
                            $trouve = true;
                            //$trouve++;
                            break;
                        }
                    }
                    if ($trouve == false) {
                        //if($trouve )
                        //il manque la reaction en question

                        // voir pour changer si passage en version OU pour
                        $react_search = false;
                    }
                    $i++;
                }
            }else{
                $valid = false;
            }
            if(!$react_search){
                $valid = false;
            }
        }



        //var_dump($valid);

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
        $mentions = Array();
        $reactions = Array();

        $must = Array();


        //var_dump($options);

        //PARTIE SUR LES MOTS
        foreach($options["words"] as $word){
            if(strlen($word) > 3) {
                $final_words[] = strtolower($word);
            }
        }

        if(isset($final_words) && $final_words != Array()){
            $terms = Array();
            foreach ($final_words as $word){
                $terms[] = Array(
                    "bool" => Array(
                        "filter" => Array(
                            "regexp" => Array(
                                "messages.content" => ".*" . $word . ".*"
                            )
                        )
                    )
                );
            }

            $now = new \DateTime();
            $before = $now->format('Y-m-d');
            $after = "2000-01-01";

            if(isset($options["date_before"])){
                $before = $options["date_before"];
            }

            if(isset($options["date_after"])){
                $after = $options["date_after"];
            }

            //PARTIES SUR LES CHANNELS
            $should_channels = Array();
            foreach($channels as $channel) {
                $should_channels[] = Array(
                    "match_phrase" => Array(
                        "channel_id" => $channel
                    )
                );
            }

            //PARTIE SUR LES REACTION
            if(isset($options["reactions"])){
                $reactions = Array();
                foreach ($options["reactions"] as $reaction){
                    $reactions[]= Array(
                        "bool" => Array(
                            "filter" => Array(
                                "regexp" => Array(
                                    "messages.reactions.reaction" => ".*".$reaction.".*"
                                )
                            )
                        )
                    );
                }

            }

            //PARTIE SUR LE SENDER

            if(isset($options["sender"])){
                $sender = Array(
                    "match_phrase" => Array(
                        "messages.sender" => $options["sender"]
                    )
                );
            }


            // PARTIE SUR LES MENTIONS
            if(isset($options["mentions"])){
                $mentions = Array();
                foreach ($options["mentions"] as $mention){
                    $mentions[]= Array(
                        "bool" => Array(
                            "must" => Array(
                                "match_phrase" => Array(
                                    "messages.mentions" => $mention
                                )
                            )
                        )
                    );
                }
            }

            $must[] = Array(
                "range" => Array(
                    "messages.date" => Array(
                        "lte" => $before,
                        "gte" => $after
                    )
                )
            );

            if(isset($options["sender"])){
                $must[] = $sender;
            }

            if(isset($options["mentions"])){
                $must[] = Array(
                    "bool" => Array(
                        "should" => $mentions,
                        "minimum_should_match" => count($options["mentions"])
                    )
                );
            }

            if(isset($options["reactions"])){
                $must[] = Array(
                    "bool" => Array(
                        "must" => Array(
                            "nested" => Array(
                                "path" => "messages.reactions",
                                "score_mode" => "avg",
                                "query" => Array(
                                    "bool" => Array(
                                        "should" => $reactions,
                                        "minimum_should_match" => count($options["reactions"])
                                    )
                                )
                            )
                        )
                    )
                );
            }

            $must[]= Array(
                    "bool" => Array(
                        "should" => Array(
                            $terms
                        ),
                        "minimum_should_match" => count($terms)
                    )
                );

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
                                    "minimum_should_match" => 1
                                )
                            ),
                            Array(
                                "nested" => Array(
                                    "path" => "messages",
                                    "score_mode" => "avg",
                                    "query" => Array(
                                        "bool" => Array(
                                            "must" => $must
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            );

            //var_dump(json_encode($options,JSON_PRETTY_PRINT));

            $list_message=Array();

            // search in ES
            $result = $this->doctrine->es_search($options);

            array_slice($result["result"], 0, 5);

            //on traite les données recu d'Elasticsearch

            foreach ($result["result"] as $bloc) {
                $messages = $bloc->getMessages();
                $compt = 0;
                foreach ($messages as $message) {
                    $word_valid = true;
                    foreach ($final_words as $word) {
                        if ($word_valid && strpos(strtolower($message["content"]), strtolower($word)) !== false) {
                        }
                        else{
                            $word_valid = false;
                        }
                    }
                    if($word_valid){
                        //var_dump("valid");
                        $message_id_in_bloc = $bloc->getIdMessages()[$compt];
                        $list_message = $this->verif_valid($message_id_in_bloc, $options_save, $list_message);
                    }
                    $compt++;
                }
            }
            //var_dump("nombre de resultat : " . count($list_message));

            // on cherche dans le bloc en cours de construction de tout les channels demandés
            foreach($channels as $channel) {
                $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("channel_id" => $channel));
                $compt = 0;
                if (isset($lastbloc) && $lastbloc->getLock() == false) {
                    foreach ($lastbloc->getMessages() as $message) {
                        $word_valid = true;
                        foreach ($final_words as $word) {
                            if ($word_valid && strpos(strtolower($message["content"]), strtolower($word)) !== false) {
                            }
                            else{
                                $word_valid = false;
                            }
                        }
                        if($word_valid){
                            $message_id_in_bloc = $lastbloc->getIdMessages()[$compt];
                            $list_message = $this->verif_valid($message_id_in_bloc, $options_save,$list_message);
                        }
                        $compt++;
                        //var_dump($compt);
                    }
                }
            }


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