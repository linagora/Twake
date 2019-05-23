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

    public function index($message,$workspace_id,$channel_id)
    {
        $message_obj = new Message($channel_id, "");
        $this->doctrine->persist($message_obj);
        $message_id = $message_obj->getId()."";
        //var_dump($message_id);
        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("workspace_id" => $workspace_id, "channel_id" => $channel_id));
        //var_dump($lastbloc);
//        //var_dump($lastbloc);
       if (isset($lastbloc) == false || $lastbloc->getLock() == true) {
           //var_dump("passage");

            $content = Array();
            $message_array_id = Array();
            $blocbdd = new Bloc($workspace_id, $channel_id, $content, $message_array_id);
            $blocbdd->setMinMessageId($message_id);
        } else
            $blocbdd = $lastbloc;
        if($blocbdd->getNbMessage() == 9){
            $blocbdd->setMaxMessageId($message_id);
            $blocbdd->setLock(true);
        }
        $blocbdd->addmessage($message, $message_id);
        $this->doctrine->persist($blocbdd);
        $this->doctrine->persist($message_obj);
        $message_obj->setBlockId($blocbdd->getId()."");
        $this->doctrine->flush();

//        //mettre a jour le bloc

        if ($blocbdd->getNbMessage() == 10){
            var_dump("PRET A INDEXER LE BLOC DE MESSAGE");

            // indexer le bloc de message
            $this->doctrine->es_put($blocbdd,$blocbdd->getEsType());

        }
        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("workspace_id" => $workspace_id, "channel_id" => $channel_id));
        var_dump($lastbloc);
    }

    public function search($words,$workspace_id){


        $terms = Array();
        foreach ($words as $word){
            $terms[] = Array(
                "bool" => Array(
                    "filter" => Array(
                        "regexp" => Array(
                            "content_keyword" => ".*".$word.".*"
                        )
                    )
                )
            );
        }

        $options = Array(
            "repository" => "TwakeGlobalSearchBundle:Bloc",
            "index" => "bloc",
            "query" => Array(
                "bool" => Array(
                    "match_phrase" => Array(
                        "workspace_id" => $workspace_id
                    ),
                    "should" => $terms
                )
            )
        );

        $id_message=Array();

        //var_dump(json_encode($options,JSON_PRETTY_PRINT));
        // search in ES
        $result = $this->doctrine->es_search($options);
        array_slice($result, 0, 5);

        // search in last bloc in database
        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("workspace_id" => $workspace_id));
        $compt = 0;
        if(isset($lastbloc)) {
            foreach ($lastbloc->getContentKeywords() as $content) {
                foreach ($words as $word) {
                    if (strpos($content, $word) !== false)
                        if (in_array($lastbloc->getMessages()[$compt], $id_message) == false)
                            $id_message[] = $lastbloc->getMessages()[$compt];
                }
                $compt++;
                //var_dump($compt);
            }


            //var_dump($result);

            //var_dump($result);
            foreach ($result as $bloc) {
                $content = $bloc->getContentKeywords();
                $compt = 0;
                foreach ($content as $phrase) {
                    foreach ($words as $word) {
                        if (strpos($phrase, $word) !== false)
                            if (in_array($bloc->getMessages()[$compt], $id_message) == false)
                                $id_message[] = $bloc->getMessages()[$compt];
                    }
                    $compt++;
                }
            }
            //var_dump($id_message);
            $messages = Array(); //content all the message object
            foreach ($id_message as $id) {
                $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $id));
                $messages[] = $message->getAsArray();
            }
        }
        return $messages ?: null;

    }

    public function Updateinbloc($message){  //this param is a message ENTITY
        //var_dump($message->getId()."");
        $bloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("id" => $message->getBlockId()));
        //var_dump($bloc->getMessages());
        $position = array_search($message->getId()."",$bloc->getMessages());
        $contents = $bloc->getContentKeywords();
        $contents[$position] = "blabla"; //$message->get;Content()
        //$bloc->setContentKeywords($contents)


        $this->doctrine->persist($bloc);
        $this->doctrine->flush();

        // Need to reindex the bloc in ES if he is already indexed
        if($bloc->getLock() == true){
            $this->doctrine->es_put($bloc,$bloc->getEsType());
        }

    }

    public function Deleteinbloc($message){

        $bloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("id" => $message->getBlockId()));
        $position = array_search($message->getId()."",$bloc->getMessages());

        if($position == 0){ //change id min or max
            $bloc->setMinMessageId($bloc->getMessages()[1]);
        }
        elseif ($position == 9){
            $bloc->setMaxMessageId($bloc->getMessages()[8]);
        }
        $bloc->setNbMessage($bloc->getNbMessage()-1);

        $contents = $bloc->getContentKeywords();
        $ids = $bloc->getMessages();
        array_splice($contents, $position, 1);
        array_splice($ids, $position, 1);
        $bloc->setContentKeywords($contents);
        $bloc->setMessages($ids);
//        unset($bloc->getContentKeywords()[$position]);
//        unset($bloc->getMessages()[$position]);


        $this->doctrine->persist($bloc);
        $this->doctrine->flush();
        //var_dump($bloc);
        if($bloc->getLock() == true){
            $this->doctrine->es_put($bloc,$bloc->getEsType());

        }

    }

    public function TestMessage()
    {
//        $messagetest="je suis seulement dans la base de données";
//        //$messagetest="je commence a voir faim ca veut dire que je vais mieux";
//        $this->index($messagetest,"d975075e-6028-11e9-b206-0242ac120005","e5d085aa-6028-11e9-922a-0242ac120005");

//        foreach($lastbloc as $bloc){
//            $this->doctrine->remove($bloc);
//            $this->doctrine->flush();
//        }

//        $words = Array("commence","données");
//        $this->search($words);


        //$this->Updateinbloc($message);

    }

}