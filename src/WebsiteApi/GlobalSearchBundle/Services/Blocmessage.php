<?php

namespace WebsiteApi\GlobalSearchBundle\Services;

use Tests\UsersBundle\Error200Test;
use WebsiteApi\GlobalSearchBundle\Entity\Bloc;
use WebsiteApi\DiscussionBundle\Entity\Message;

class Blocmessage

{
    private $doctrine;
    private $doublon_id = Array();

    private $list_messages = Array("messages" => Array(), "scroll_id" => "");


    public function __construct($doctrine)
    {
        $this->doctrine = $doctrine;
    }

    public function verif_valid($message_id_in_bloc, $options){
        $valid = true;
        $message_bdd = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message_id_in_bloc));
        if ($valid && isset($options["sender"])) {
            if ($message_bdd->getSender()->getId() . "" != $options["sender"]) {
                $valid = false;
            }
        }
        if ($valid && isset($options["date_before"]) && ($message_bdd->getCreationDate()->format('Y-m-d') > $options["date_before"])) {
            $valid = false;
        }
        if ($valid && isset($options["date_after"]) && ($message_bdd->getCreationDate()->format('Y-m-d') < $options["date_after"])) {
            $valid = false;
        }

        if ($valid && isset($options["pinned"]) && $message_bdd->getPinned() != $options["pinned"]){
            $valid = false;
        }


        if($valid && isset($options["application_id"]) && ($message_bdd->getApplicationId() != $options["application_id"])){
            $valid = false;
        }

        if ($valid && isset($options["tags"])){
            $tags = $message_bdd->gettags();
            $tags_search = true;
            $i = 0;
            if(isset($tags)) {
                while ($tags_search && $i < count($options["tags"])) {
                    $trouve = false;
                    foreach ($message_bdd->gettags() as $tag) {
                        if ($tag == $options["tags"][$i]) {
                            $trouve = true;
                            break;
                        }
                    }
                    if ($trouve == false) {
                        $tags_search = false;
                    }
                    $i++;
                }
            }
            else {
                $valid = false;
            }
            if (!$tags_search) {
                $valid = false;
            }
        }

        if ($valid && isset($options["mentions"])) {
            $mentions = Array();
            if (is_array($message_bdd->getContent()["prepared"][0])) {
                foreach ($message_bdd->getContent()["prepared"][0] as $elem) {
                    if (is_array($elem)) {
                        $id = explode(":", $elem["content"])[1];
                        $mentions[] = $id;
                    }
                }
                $mentions = array_unique($mentions);
            }

            if (!array_intersect($options["mentions"], $mentions) == $options["mentions"]) {
                $valid = false;
            }
        }

        if ($valid && isset($options["reactions"])) {
            $react_search = true;
            $i = 0;
            // on parcours toute les reactions saisites
            $reaction = $message_bdd->getReactions();
            if (isset($reaction)) {
                while ($react_search && $i < count($options["reactions"])) {
                    $trouve = false;
                    foreach (array_keys($message_bdd->getReactions()) as $reaction) {
                        if (strpos(strtolower($reaction), strtolower($options["reactions"][$i])) !== false) {
                            $trouve = true;
                            break;
                        }
                    }
                    if ($trouve == false) {
                        $react_search = false;
                    }
                    $i++;
                }
            } else {
                $valid = false;
            }
            if (!$react_search) {
                $valid = false;
            }
        }

        if ($valid && !in_array($message_id_in_bloc, $this->doublon_id)) {
            $this->doublon_id[] = $message_id_in_bloc;
            $channel_entity = $this->doctrine->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $message_bdd->getChannelId()));
            $this->list_messages["messages"][]= Array("message" => $message_bdd->getAsArray(), "channel"=> $channel_entity->getAsArray());
        }

    }

    public function search($options,$channels){

        $final_words = Array();
        $options_save = $options;
        $mentions = Array();
        $reactions = Array();
        $must = Array();


        //PARTIE SUR LES MOTS
        if(isset($options["words"])) {
            foreach ($options["words"] as $word) {
                if (strlen($word) > 3) {
                    $final_words[] = strtolower($word);
                }
            }
        }

        if(isset($final_words) && $final_words != Array()) {
            $terms = Array();
            foreach ($final_words as $word) {
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
                foreach ($options["reactions"] as $reaction) {
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

            if(isset($options["pinned"])){

            }

            //PARTIES SUR LES TAGS

            if(isset($options["tags"])){
                $should_tags = Array();
                foreach($options["tags"] as $tag) {
                    $should_tags[] = Array(
                        "match_phrase" => Array(
                            "messages.tags" => $tag
                        )
                    );
                }

                $must[] = Array(
                    "bool" => Array(
                        "should" => $should_tags,
                        "minimum_should_match" => count($should_tags)
                    )
                );
            }

            //PARTIE SUR PINNED
            if(isset($options["pinned"])){
                $must[] = Array(
                  "match_phrase" => Array(
                      "messages.pinned" => $options["pinned"]
                  )
                );
            }

            // PARTIE SUR LES MENTIONS
            if (isset($options["mentions"])) {
                $mentions = Array();
                foreach ($options["mentions"] as $mention) {
                    $mentions[] = Array(
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
                $must[] = Array(
                    "match_phrase" => Array(
                        "messages.sender" => $options["sender"]
                    )
                );
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

            if(isset($options["application_id"])){
                $must[] = Array(
                    "match_phrase" => Array(
                        "messages.application_id" => $options["application_id"]
                    )
                );;
            }

            if(isset($terms) && $terms != Array()){
                $must[]= Array(
                    "bool" => Array(
                        "should" => Array(
                            $terms
                        ),
                        "minimum_should_match" => count($terms)
                    )
                );
            }

            $options = Array(
                "repository" => "TwakeGlobalSearchBundle:Bloc",
                "index" => "message_bloc",
                "size" => 1,
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


            // search in ES
            $result = $this->doctrine->es_search($options);

            array_slice($result["result"], 0, 5);

            $scroll_id = $result["scroll_id"];

            //on traite les données recu d'Elasticsearch

            foreach ($result["result"] as $bloc) {
                $bloc = $bloc[0];
                $messages = $bloc->getMessages();
                $compt = 0;
                foreach ($messages as $message) {
                    if(isset($options_save["words"])){
                        $word_valid = true;

                        foreach ($final_words as $word) {
                            if ($word_valid && strpos(strtolower($message["content"]), strtolower($word)) !== false) {
                            } else {
                                $word_valid = false;
                            }
                        }
                        if ($word_valid) {
                            $message_id_in_bloc = $bloc->getIdMessages()[$compt];
                            $this->verif_valid($message_id_in_bloc, $options_save);
                        }
                    }
                    elseif (!isset($options["words"]) && isset($options_save["application_id"]) && isset($message["application_id"])){
                        //POUR LES MESSAGES D APPLICATION COMME LES ENVOIES DE FICHIER QUI ONT PAS DE TEXTE
                        $message_id_in_bloc = $bloc->getIdMessages()[$compt];
                        $this->verif_valid($message_id_in_bloc, $options_save);
                    }
                    $compt++;
                }
            }

            // on cherche dans le bloc en cours de construction de tout les channels demandés
            foreach ($channels as $channel) {
                $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("channel_id" => $channel));
                $compt = 0;
                if (isset($lastbloc) && $lastbloc->getLock() == false) {
                    foreach ($lastbloc->getMessages() as $message) {
                        if(isset($options_save["words"])) {
                            $word_valid = true;
                            foreach ($final_words as $word) {
                                if ($word_valid && strpos(strtolower($message["content"]), strtolower($word)) !== false) {
                                } else {
                                    $word_valid = false;
                                }
                            }
                            if ($word_valid) {
                                $message_id_in_bloc = $lastbloc->getIdMessages()[$compt];
                                $this->verif_valid($message_id_in_bloc, $options_save);
                            }
                        }
                        elseif (!isset($options["words"]) && isset($options_save["application_id"]) && isset($message["application_id"])){
                            //POUR LES MESSAGES D APPLICATION COMME LES ENVOIES DE FICHIER QUI ONT PAS DE TEXTE

                            $message_id_in_bloc = $lastbloc->getIdMessages()[$compt];
                            $this->verif_valid($message_id_in_bloc, $options_save);
                        }
                            $compt++;
                        }
                }
            }
            $this->list_messages["scroll_id"] = $scroll_id;


    return $this->list_messages ?: null;

    }


    public function TestMessage()
    {
        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findBy(Array());
        foreach($lastbloc as $bloc){
           $this->doctrine->remove($bloc);
           $this->doctrine->flush();
        }

    }

}