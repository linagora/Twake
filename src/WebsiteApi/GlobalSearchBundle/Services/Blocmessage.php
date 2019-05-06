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

    public function IndexBloc($message,$workspace_id,$channel_id)
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

    public function SearchMessage($words){


//        $must_es = Array(
//            "match_phrase" => Array(
//                "workspace_id" => "workspace_id"
//            ),
//            "match_phrase" => Array(
//                "channel_id" => "channel_id"
//            )
//        );

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


        //Pour la version en prod "must" => $must_es,

        $options = Array(
            "repository" => "TwakeGlobalSearchBundle:Bloc",
            "index" => "bloc",
            "query" => Array(
                "bool" => Array(
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
        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array("workspace_id" => "480f11b4-4747-11e9-aa8e-0242ac120005", "channel_id" => "480f11b4-4747-11e9-aa8e-0242ac120005"));
        //var_dump($lastbloc);
        $compt = 0;
        foreach ($lastbloc->getContentKeywords() as $content){
            foreach ($words as $word){
                if( strpos( $content, $word ) !== false )
                    if (in_array($lastbloc->getMessages()[$compt],$id_message) == false)
                        $id_message[]=$lastbloc->getMessages()[$compt];
            }
            $compt++;
            //var_dump($compt);
        }


        //var_dump($result);

        //var_dump($result);
        foreach ($result as $bloc){
            $content = $bloc->getContentKeywords();
            $compt = 0;
            foreach($content as $phrase){
                foreach ($words as $word){
                    if( strpos( $phrase, $word ) !== false )
                        if (in_array($bloc->getMessages()[$compt],$id_message) == false)
                              $id_message[]=$bloc->getMessages()[$compt];
                }
                $compt++;
            }
        }
        //var_dump($id_message);
        $messages = Array(); //content all the message object
        foreach($id_message as $id) {
            $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $id));
            $messages[] = $message;
           }

        return $messages;

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
        //$message= Array("Salut ca va ?", "Oui et toi", "mouais ca va mais j'ai faim", "Viens on va manger", "J'ai pas de sous", "Je paye", "c'est cool", "Tacos", "Ca marche");
//        $bloc = Array("Cinquante et deux dix",
//            "Les Romains c'est l'avenir",
//            "Ça serait pas plutôt cinquante et dix et dix pour les romains ?",
//            "@bombidabiere tetais chaud pour aller voir endgame ce soir? D'ailleurs s'il y en a d'autres manifestez vous",
//            "J y vais demain normalement",
//            "ouais nous on a réservé les places pour la séance de 20h en vo à l'ugc et on va au tacos à 18h30",
//            "Bon j'ai besoin de l'indexation de masse de message je vais prendre les messages d'ici pour me faire un jeu de test",
//            "vous pouvez faire coucou si vous voulez",
//            "bon j'ai pas pris la partie sur octante mon truc doit être multi langue mais l'argot peut etre exclus"
//            );
       $content = Array("Ha attends je regarde, non c'est un plus clair ",
            "C'est le bleu #317595 on refera un choix final plus tard mais on aime bien lui en attendant pour avancer, tu as moyen de changer les couleurs rapidement pendant que le projet avance ?",
            "C'est noté! Oui sans problème les couleurs sont variables",
            "Un peu à la illustrator avec les palettes ? (j'avais cherché sans succès pendant ma courte période d'utilisation de Sketch...)",
            "C'est ça en gros les couleurs, shadows, gradients et font peuvent être définis dans des \"layer style\" et \"text style\" qui sont donc variables facilement. Pour les font c'est un peu plus long à setter mais pour les couleurs c'est très simple",
            "C'est génial ça, merci de l'info je regarderai, je trouvais que ça manquait cruellement !",
            "C'est sympathique comme début ! La recherche me semble très grande, je pense qu'on pourrait mettre des boutons à côté de la recherche pour accéder à l'édition de la chaîne en cours (membres, nom, ce qu'on trouve actuellement dans les \"...\" au hover du channel).
            En ce qui concerne les barres du bas, pour l'instant je ne sais pas, par contre on sera obligé de mettre les icônes d'applications comme actuellement (pour les smileys, les appels, les gifs et les autres intégrations)
            Ensuite il y a les onglets, je n'ai pas de problème avec eux, mais ils me font penser à deux choses :
            - déjà on a un cas ou on peut avoir deux fois une même application dans les onglets, par exemple j'attaches deux dossiers dans la chaîne et ça fais deux onglets avec la même icône, actuellement on groupe les onglets par application afin de n'afficher l'icone qu'une fois à gauche des onglets correspondant
            - ensuite les application peuvent être développées par des tiers, ce qui fait qu'il y aura des icônes tierces utilisées possiblement. Du coup soit on met des icône plus chargées pour nos applications, soit on garde ce que tu proposes ce qui donnes l'impression que l'application est plus intégrée à la plateforme (mais d'un autre côté elle reste optionnelle aujourd'hui, il est possible de ne pas utiliser de calendrier ou de stockage sur Twake, et on retrouve ces applications dans notre marketplace d'applications)
            Encore une dernière remarque, j'ai l'impression que les 3 éléments du header (titre, type de chahnel et nombre d'user) sont trop serrées par rapport au reste (pour une fois que c'est trop serré haha !)
            Ça pourrait être sympa de s'appeler semaine prochaine pour faire un premier debrief en visio ? 🙂
            Merci pour ces retours ! je vous envoie prochainnement un créneau pour qu'on puisse s'appeler",
           "Un peu à la illustrator avec les palettes ? (j'avais cherché sans succès pendant ma courte période d'utilisation de Sketch...)",
            "On a un peu discuté avec Benoit sur différents points :
            - la recherche globale, on peut éventuellement la déplacer dans la vue principale (droite) à la manière de slack, car elle va être accessible depuis toutes les applications de toute manière, donc c'est une option possible 🙂
            - l'espacement entre le bord haut de la fenêtre et les premiers éléments des deux barres de gauche est vachement grand je trouve, bien que finalement je trouve l'espacement de 24px entre les workspaces très bien ✅ 
            - moi j'aime bien la couleur sombre du 005 mais pas Benoit qui trouve ça trop gris/noir et donc pas assez coloré, par contre on est d'accord sur le fait que la version 005 est celle qu'on préfère pour le moment (celle avec le fond gris clair), reste donc à jouer sur cette couleur sombre et voir comment on peut l'améliorer !"
        );

        $messagetest="je suis seulement dans la base de données";
        //$messagetest="je commence a voir faim ca veut dire que je vais mieux";
        //$this->IndexBloc($messagetest,"480f11b4-4747-11e9-aa8e-0242ac120005","480f11b4-4747-11e9-aa8e-0242ac120005");


//        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findBy(Array());
//        //var_dump($lastbloc);
//        foreach($lastbloc as $bloc){
//            $this->doctrine->remove($bloc);
//            $this->doctrine->flush();
//        }

        //$mess = $message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => "acda5224-6cd7-11e9-8bf9-0242ac130002"));
        //var_dump($mess);

//        $lastbloc = $this->doctrine->getRepository("TwakeGlobalSearchBundle:Bloc")->findOneBy(Array());
//        var_dump($lastbloc);


        $words = Array("commence","données");
        $this->SearchMessage($words);

        //$message = $this->doctrine->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => "f155d92a-6cdf-11e9-9077-0242ac130002"));


        //$this->Updateinbloc($message);

        //$this->Deleteinbloc($message);

        //f173c7be-6cdf-11e9-ab9e-
//
//        $content = Array();
//        $message_array_id = Array();
//        $workspace_id = "480f11b4-4747-11e9-aa8e-0242ac120005";
//        $channel_id = "480f11b4-4747-11e9-aa8e-0242ac120005";
//        $blocbdd = new Bloc($workspace_id, $channel_id, $content, $message_array_id);
//
//        $message_obj = new Message($channel_id, "");
//        $this->doctrine->persist($message_obj);
//        $message_id = $message_obj->getId()."";
//
//        $blocbdd->addmessage($messagetest, $message_id);
//        $this->doctrine->persist($blocbdd);
//        $this->doctrine->persist($message_obj);
//
//        $message_obj->setBlockId($blocbdd->getId()."");
//        $this->doctrine->flush();
//
//        $this->doctrine->es_put($blocbdd,"message");

    }

}