<?php

namespace Tests\AccessBundle;

use Tests\WebTestCaseExtended;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\ChannelsBundle\Entity\ChannelMember;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\Group;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceLevel;

class ExterneUserTest extends WebTestCaseExtended
{
    public function testWexterne()
    {
        list($g1,$w1,$c1,$u1) = $this->getStuff();
        $u2 = $this->newUserByName("usertest002");
        $this->login($u1->getUsernameCanonical());
        $result = $this->doPost("/ajax/workspace/members/addlist",Array("list"=>$u2->getUsernameCanonical()."|1","workspaceId"=>$w1->getId()));
        $this->assertEquals(Array($u2->getUsernameCanonical()),$result["data"]["added"]["user"],"User2 not invited");
        // on se connecte à u2 pour voir ce qu'il en est
        $this->assertEquals(true,$this->verifyIfUserIsInChannel($u2,$w1,$c1,true),"u2 is not invited as wexterne");
    }

    public function testShavinte(){
        list($g1,$w1,$c1,$u1) = $this->getStuff();
        $u3 = $this->newUserByName("usertest003");
        $this->updateChavinteFromFront($w1,$c1,$u1,[$u3->getId()],[]);
        $this->assertEquals(true,$this->verifyIfUserIsInChannel($u3,$w1,$c1,true),"u3 is not invited as chanvité");
        $this->updateChavinteFromFront($w1,$c1,$u1,[],[$u3->getId()]);
        $this->assertEquals(false,$this->verifyIfUserIsInChannel($u3,$w1,$c1,true),"u3 is still invited as chanvité");
    }

    public function testShavinteMail(){
        list($g1,$w1,$c1,$u1) = $this->getStuff();
        $mail1 = "mail1@benoit.best";
        $mailEntity = $this->getDoctrine()->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("mail"=>$mail1));
        if($mailEntity){
            $this->getDoctrine()->remove($mailEntity);
        }
        $this->updateChavinteFromFront($w1,$c1,$u1,[$mail1],[]);
        $u4 = $this->newUserByName("usertest004",$mail1);
        $this->assertEquals(true,$this->verifyIfUserIsInChannel($u4,$w1,$c1,true),"u4 is not invited as chanvité");
        // on vérifi que $mail1 n'est plus dans la liste
        $this->assertEquals(false,$this->verifyIfUserIsInChannel($u4,$w1,$c1,true,$mail1),"mail1 is still invited as chanvité");
    }

//
//
//
//        $mail2 = "mail2@benoit.best";
//
//
//        $mailEntity = $this->getDoctrine()->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("mail"=>$mail2));
//        if($mailEntity){
//            $this->getDoctrine()->remove($mailEntity);
//        }
//        $this->getDoctrine()->flush();
//
//
//
//        $this->login($u1->getUsernameCanonical());
//
//        // on invite le copain user2 en wexterne
//        $result = $this->doPost("/ajax/workspace/members/addlist",Array("list"=>$u2->getUsernameCanonical()."|1","workspaceId"=>$w1->getId()));
//        $this->assertEquals(Array($u2->getUsernameCanonical()),$result["data"]["added"]["user"],"User2 not invited");
//
//        // on invite le copain user3 et mail1 en chaviter
//        $this->updateChavinteFromFront($w1,$c1,$u1,[$u3->getId(),$mail1],[]);
//
//
//        // on se connecte à u2 pour voir ce qu'il en est
//
//        $this->assertEquals(true,$this->verifyIfUserIsInChannel($u3,$w1,$c1,true),"u2 is not invited as wexterne");
//
//        // on se connecte à u3 pour voir ce qu'il en est
//        $this->assertEquals(true,$this->verifyIfUserIsInChannel($u3,$w1,$c1,true),"u3 is not invited as chanvité");
//
//        /* {
//             "id":"ddf3e0a4-cfd9-11e9-ada2-0242ac140006",
//             "front_id":"a41586efb886f454ace1bc5157675eab9d07ee06",
//             "icon":"",
//             "name":"",
//             "description":"",
//             "channel_group_name":"",
//             "private":false,
//             "direct":false,
//             "application":true,
//             "app_id":"c0b97242-56e4-11e9-a37c-0242ac120005",
//             "app_group_id":"",
//             "app_bot_identifier":"",
//             "original_workspace":"dde7dcf0-cfd9-11e9-a0e7-0242ac140006",
//             "original_group":"c3f5abc0-cfb0-11e9-a3f1-0242ac140003",
//             "members_count":null,
//             "last_activity":1567687025,
//             "members":["f5407788-47d8-11e9-9635-0242ac120005"],
//             "ext_members":["eabcd938-8dbe-11e9-9e6b-0242ac130005"],
//             "connectors":[],
//             "tabs":[],
//             "messages_increment":0,
//             "_user_last_message_increment":null,
//             "_user_last_access":1567687025,
//             "_user_muted":false
//         }*/
//
//
//
//        // on se créer un compte sur mail1
//        $u4 = $this->newUserByName("usertest004",$mail1);
//        //on se connecte à user4 pour voir si c'est bien un chavité
//       $this->assertEquals(true,$this->verifyIfUserIsInChannel($u4,$w1,$c1,true),"u4 is not invited as chanvité");
//        // on vérifi que $mail1 n'est plus dans la liste
//        $this->assertEquals(false,$this->verifyIfUserIsInChannel($u4,$w1,$c1,true,$mail1),"mail1 is still invited as chanvité");
//
//       // u1 crée un channel privé et un public
//
//
//        //u1 supprime u3 des chavité
//        $this->updateChavinteFromFront($w1,$c1,$u1,[],[$u3->getId()]);
//
//        //u3 se connecte pour voir s'il est encore dans le channel
//        $this->assertEquals(false,$this->verifyIfUserIsInChannel($u3,$w1,$c1,true),"u3 is still invited as chanvité");

    private function getStuff(){
        $u1 = $this->newUserByName("usertest001");
        $g1 = $this->newGroup($u1->getId(),"grptest1");
        $w1 = $this->newWorkspace("workspace1",$g1);
        $w1->setMemberCount(1);
        $this->getDoctrine()->persist($w1);
        $rightAdmin = new WorkspaceLevel();
        $rightAdmin->setIsAdmin(true);
        $rightAdmin->setWorkspace($w1);
        $this->getDoctrine()->persist($rightAdmin);
        $linkWorkspaceUser = new WorkspaceUser($w1,$u1,$rightAdmin->getId());
        $this->getDoctrine()->persist($linkWorkspaceUser);

        $c1 = $this->newChannel($g1,$w1,$u1);

        return Array($g1,$w1,$c1,$u1);
    }


    private function getChannelsFromFront($workspace,$channel,$user){
        $this->login($user->getUsernameCanonical());
        $result = $this->doPost("/ajax/core/collections/init", Array(
            "collection_id" => "channels/workspace/".$workspace->getId(),
            "options" => Array(
                "type" => "channels/workspace",
                "get_options" => Array(
                    "workspace_id" => $workspace->getId(),
                ),
                "_grouped" => true,
            )
        ));
        $channels = $result["data"]["get"];
        return $channels;
    }

    private function updateChavinteFromFront($workspace,$channel,$user,$toAdd=[],$toRemove=[]){
        $channels = $this->getChannelsFromFront($workspace,$channel,$user);
        $frontChan = $this->getChannelById($channels,$channel->getId());
        if($frontChan){
            $members = $frontChan["ext_members"];
            foreach($toAdd as $adding){
                if(!in_array($adding,$members)){
                    $members[] = $adding;
                }
            }
            foreach($toRemove as $removing){
                if(($index = array_search($removing,$members))){
                    array_splice($members,$index,1);
                }
            }
            $frontChan["ext_members"] = $members;
            $result = $this->doPost("/ajax/channels/save", Array(
                "collection_id"=> "",
                "object" => $frontChan,
            ));
            return true;
        }
        return false;
    }

    private function verifyIfUserIsInChannel($user,$workspace,$channel,$hasToBeExterne,$mail=null){
        $this->login($user->getUsernameCanonical());
        $result = $this->doPost("/ajax/core/collections/init", Array(
            "collection_id" => "channels/workspace/".$workspace->getId(),
            "options" => Array(
                "type" => "channels/workspace",
                "get_options" => Array(
                    "workspace_id" => $workspace->getId(),
                ),
                "_grouped" => true,
            )
        ));
        $channels = $result["data"]["get"];
        $isOk = $this->isInChannel($channels,$user,$channel,$hasToBeExterne,$mail);
        $this->logout();
        return $isOk;
    }

    private function isInChannel($channelInWorkspace,$user,$channel,$hasToBeExterne,$mail=null){
        $chan = $this->getChannelById($channelInWorkspace,$channel->getId());
        if($chan){
            if($hasToBeExterne){
                $externeMembers = $chan["ext_members"];
                foreach ($externeMembers as $ext){
                    if($mail && $ext == $mail){
                        return true;
                    }
                    elseif($ext == $user->getId()){
                        return true;
                    }
                }
            }
            else{
                $members = $chan["members"];
                foreach ($members as $memb){
                    if($memb == $user->getId()){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private function getChannelById($channelList,$channelId){
        if(is_array($channelList)){
            foreach($channelList as $chan){
                if($chan["id"] == $channelId){
                    return $chan;
                }
            }
        }
        return false;
    }
}