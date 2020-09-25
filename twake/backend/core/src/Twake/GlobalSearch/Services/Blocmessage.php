<?php

namespace Twake\GlobalSearch\Services;

use App\App;

class Blocmessage

{
    private $doctrine;


    public function __construct(App $app)
    {
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
    }

    public function search($options, $channels)
    {

        $known_channels_by_id = Array();
        $known_workspaces_by_id = Array();

        $doublon_id = Array();
        $list_messages = Array("results" => Array(), "scroll_id" => "");

        $final_words = Array();
        if (isset($options["words"])) {
            foreach ($options["words"] as $word) {
                if (strlen($word) >= 2) {
                    $final_words[] = strtolower($word);
                }
            }
        }

        $channels_ids = [];
        foreach ($channels as $channel) {
            if (is_object($channel)) {
                $known_channels_by_id[$channel->getId()] = $channel->getAsArray();
                $channel = $channel->getId();
            }
            if (is_array($channel)) {
                $known_channels_by_id[$channel["id"]] = $channel;
                $channel = $channel["id"];
            }
            $channels_ids[] = $channel;
        }
        $channels = $channels_ids;

        $must = Array();


        $words = count($final_words) > 0 ? preg_filter('/($|^)/', '.*', $final_words) : false;
        ESUtils::createRegexShouldMatch($words, "messages.content", "all", $must);

        $reactions = isset($options["reactions"]) ? $options["reactions"] : false;
        ESUtils::createShouldMatch($reactions, "messages.reactions", "all", $must);


        $mentions = isset($options["mentions"]) ? $options["mentions"] : false;
        ESUtils::createShouldMatch($mentions, "messages.mentions", "all", $must);

        $tags = isset($options["tags"]) ? $options["tags"] : false;
        ESUtils::createShouldMatch($tags, "messages.tags", "all", $must);

        $pinned = (isset($options["pinned"]) && $options["pinned"]) ? $options["pinned"] : false;
        ESUtils::createMatchPhrase($pinned, "messages.pinned", $must);

        $created_before = isset($options["date_before"]) ? date("Y-m-d", intval($options["date_before"])) : false;
        $created_after = isset($options["date_after"]) ? date("Y-m-d", intval($options["date_after"])) : false;
        ESUtils::createRange($created_after, $created_before, "messages.date", $must);

        $sender = isset($options["sender"]) ? $options["sender"] : false;
        ESUtils::createMatchPhrase($sender, "messages.sender", $must);

        $application_id = isset($options["application_id"]) ? $options["application_id"] : false;
        ESUtils::createMatchPhrase($application_id, "messages.application_id", $must);

        $should_channels = Array();
        foreach ($channels as $channel) {
            $should_channels[] = Array(
                "match_phrase" => Array(
                    "channel_id" => $channel
                )
            );
        }

        $search_data = Array(
            "repository" => "Twake\GlobalSearch:Bloc",
            "index" => "message_bloc",
            "size" => 10,
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
        $result = $this->doctrine->es_search($search_data);
        $list_messages["scroll_id"] = $result["scroll_id"];

        $list_messages["es_res"] = count($result["result"]);

        $blocs = [];
        foreach ($result["result"] as $bloc) {
            $blocs[] = $bloc[0];
        }

        // on cherche dans le bloc en cours de construction de tout les channels demandés
        foreach ($channels as $channel) {
            $lastbloc = $this->doctrine->getRepository("Twake\GlobalSearch:Bloc")->findOneBy(Array("channel_id" => $channel));
            if (isset($lastbloc) && $lastbloc->getLock() == false) {
                $blocs[] = $lastbloc;
            }
        }

        foreach ($blocs as $bloc) {
            $messages = $bloc->getMessages();
            foreach ($messages as $message) {

                if (!is_array($message)) {
                    continue;
                }

                $message_id_in_bloc = $message["id"];

                if ($message_id_in_bloc) {

                    $valid = $this->verif_valid(null, $message, $options);

                    if ($valid && !in_array($message_id_in_bloc, $doublon_id)) {

                        $message_bdd = $this->doctrine->getRepository("Twake\Discussion:Message")->findOneBy(Array("id" => $message["id"]));

                        if(!$message_bdd){
                            continue;
                        }

                        $doublon_id[] = $message_id_in_bloc;

                        if (!isset($known_channels_by_id[$message_bdd->getChannelId()])) {
                            $channel_entity = $this->doctrine->getRepository("Twake\Channels:Channel")->findOneBy(Array("id" => $message_bdd->getChannelId()));
                            $known_channels_by_id[$message_bdd->getChannelId()] = $channel_entity->getAsArray();
                        }

                        $workspace_array = null;
                        if ($channel_array["original_workspace"]) {
                            if (!isset($known_workspaces_by_id[$channel_array["original_workspace"]])) {
                                $workspace_entity = $this->doctrine->getRepository("Twake\Workspaces:Workspace")->findOneBy(Array("id" => $channel_array["original_workspace"]));
                                $known_workspaces_by_id[$channel_array["original_workspace"]] = $workspace_entity->getAsArray();
                            }
                            $workspace_array = $known_workspaces_by_id[$channel_array["original_workspace"]];
                        }

                        $channel_array = $known_channels_by_id[$message_bdd->getChannelId()];

                        $list_messages["results"][] = Array(
                            "score" => 1,
                            "type" => "message",
                            "message" => $message_bdd->getAsArray(),
                            "channel" => $channel_array,
                            "workspace" => $workspace_array
                        );
                    }

                }

            }
        }


        return $list_messages;

    }

    public function verif_valid($message_bdd, $message_array, $options)
    {

        $final_words = Array();
        if (isset($options["words"])) {
            foreach ($options["words"] as $word) {
                $final_words[] = strtolower($word);
            }
        }

        $valid = true;

        foreach ($final_words as $word) {
            if ($word) {
                if ($valid && isset($message_array["content"]) && strpos(strtolower($message_array["content"]), strtolower($word)) !== false) {
                } else {
                    $valid = false;
                }
            }
        }

        if ($valid && isset($options["sender"])) {
            if ($message_array["sender"] . "" != $options["sender"]) {
                $valid = false;
            }
        }
        if ($valid && isset($options["date_before"]) && (
                (\DateTime::createFromFormat("Y-m-d", $message_array["date"]))->getTimestamp() >
                intval($options["date_before"])
            )
        ) {
            $valid = false;
        }
        if ($valid && isset($options["date_after"]) && (
                (\DateTime::createFromFormat("Y-m-d", $message_array["date"]))->getTimestamp() <
                intval($options["date_after"])
            )) {
            $valid = false;
        }

        if ($valid && isset($options["pinned"]) && $message_array["pinned"] != $options["pinned"]) {
            $valid = false;
        }

        if ($valid && isset($options["application_id"]) && ($message_array["application_id"] != $options["application_id"])) {
            $valid = false;
        }

        if ($valid && isset($options["tags"])) {
            $tags = $message_array["tags"];
            if (!$message_array["tags"]) {
                $message_array["tags"] = Array();
            }
            $tags_search = true;
            $i = 0;
            if (isset($tags)) {
                while ($tags_search && $i < count($options["tags"])) {
                    $trouve = false;
                    foreach ($message_array["tags"] as $tag) {
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
            } else {
                $valid = false;
            }
            if (!$tags_search) {
                $valid = false;
            }
        }

        if ($valid && isset($options["mentions"])) {
            if (!array_intersect($options["mentions"], $message_array["mentions"]) == $options["mentions"]) {
                $valid = false;
            }
        }

        if ($valid && isset($options["reactions"])) {
            $react_search = true;
            $i = 0;
            // on parcours toute les reactions saisites
            $reaction = $message_array["reactions"];
            if (!$reaction) {
                $reaction = Array();
            }
            if (isset($reaction)) {
                while ($react_search && $i < count($options["reactions"])) {
                    $trouve = false;
                    foreach (array_keys($message_array["reactions"]) as $reaction) {
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

        return $valid;

    }

}
