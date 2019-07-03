<?php

namespace Tests\AccessBundle;

use Tests\WebTestCaseExtended;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;
use WebsiteApi\WorkspacesBundle\Entity\Workspace;
use WebsiteApi\WorkspacesBundle\Entity\Group;

class AccessTest extends WebTestCaseExtended
{
    public function testAccess(){

        // ON CREE UN GROUP POUR CREER NOS DEUX WORKSPACES
        $group = new Group("group_for_test");
        $this->get("app.twake_doctrine")->persist($group);
        $this->get("app.twake_doctrine")->flush();


        // ON CREE NOS DEUX WORKSPACES POUR FAIRE NOS TESTS

            //creation du premier workspace
        $workspace1 = new Workspace("workspace1_for_test");
        $workspace1->setGroup($group);
        $this->get("app.twake_doctrine")->persist($workspace1);
        $this->get("app.twake_doctrine")->flush();
        $workspace1_id = $workspace1->getId()."";

            //creation du deuxieme workspace
        $workspace2 = new Workspace("workspace2_for_test");
        $workspace2->setGroup($group);
        $this->get("app.twake_doctrine")->persist($workspace2);
        $this->get("app.twake_doctrine")->flush();
        $workspace2_id = $workspace2->getId()."";

        //ON CREE 2 USERS

        $this->removeUserByName("usertest002");
        $this->newUserByName("usertest002");

        $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest002",
            "_password" => "usertest002"
        ));
        $result = $this->doPost("/ajax/users/current/get", Array());
        $user2_id = json_decode($result->getContent(),true)["data"]["id"];

        $result = $this->doPost("/ajax/users/logout", Array(
        ));
        $this->clearClient();

        $this->removeUserByName("usertest001");
        $this->newUserByName("usertest001");

        $this->doPost("/ajax/users/login", Array(
            "_username" => "usertest001",
            "_password" => "usertest001"
        ));
        $result = $this->doPost("/ajax/users/current/get", Array());
        $user1_id = json_decode($result->getContent(),true)["data"]["id"];

        $user1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user1_id));
        $user2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user2_id));

        // POUR FAIRE LE LIEN ENTRE LE USER1 ET LE WORKSPACE 1 (RESPECTIVEMENT USER2 WORKSPACE2) -> ON CREE DEUX WORKSPACEUSERS
        $workspace1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace1_id));
        $workspace2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace2_id));

//        //creation workspaceUser1
        $workspaceUser1 = new WorkspaceUser($workspace1, $user1, null);
        $this->get("app.twake_doctrine")->persist($workspaceUser1);
        $this->get("app.twake_doctrine")->flush();

        //creation workspaceUser2
        $workspaceUser2 = new WorkspaceUser($workspace2, $user2, null);
        $this->get("app.twake_doctrine")->persist($workspaceUser2);
        $this->get("app.twake_doctrine")->flush();


        //POUR CHAQUE WORKSPACE, ON CREE DEUX CHANNELS

            //pour le workspace1
        $channel1 = new Channel();
        $channel1->setOriginalWorkspaceId($workspace1_id);
        $channel1->setMembers(Array($user1_id)); // pour donner acces a user1 au channel1
        $this->get("app.twake_doctrine")->persist($channel1);
        $this->get("app.twake_doctrine")->flush();
        $channel1_ID = $channel1->getId();

        $channel2 = new Channel();
        $channel2->setOriginalWorkspaceId($workspace1_id);
        $this->get("app.twake_doctrine")->persist($channel2);
        $this->get("app.twake_doctrine")->flush();
        $channel2_ID = $channel2->getId();

            //pour le workspace2
        $channel3 = new Channel();
        $channel3->setOriginalWorkspaceId($workspace2_id);
        $channel3->setMembers(Array($user2_id)); // pour donner acces a user2 au channel3
        $this->get("app.twake_doctrine")->persist($channel3);
        $this->get("app.twake_doctrine")->flush();
        $channel3_ID = $channel3->getId();

        $channel4 = new Channel();
        $channel4->setOriginalWorkspaceId($workspace2_id);
        $this->get("app.twake_doctrine")->persist($channel4);
        $this->get("app.twake_doctrine")->flush();
        $channel4_ID = $channel4->getId();

        //  ON CREE DEUX MESSAGES PAR CHANNEL

            //pour le channel 1
        $message1 = new Message($channel1_ID, "null");
        $this->get("app.twake_doctrine")->persist($message1);
        $this->get("app.twake_doctrine")->flush();
        $message1_ID = $message1->getId();

        $message2 = new Message($channel1_ID, "null");
        $this->get("app.twake_doctrine")->persist($message2);
        $this->get("app.twake_doctrine")->flush();
        $message2_ID = $message2->getId();

        //pour le channel 2
        $message3 = new Message($channel2_ID, "null");
        $this->get("app.twake_doctrine")->persist($message3);
        $this->get("app.twake_doctrine")->flush();
        $message3_ID = $message3->getId();

        $message4 = new Message($channel2_ID, "null");
        $this->get("app.twake_doctrine")->persist($message4);
        $this->get("app.twake_doctrine")->flush();
        $message4_ID = $message4->getId();

        //pour le channel 3
        $message5 = new Message($channel3_ID, "null");
        $this->get("app.twake_doctrine")->persist($message5);
        $this->get("app.twake_doctrine")->flush();
        $message5_ID = $message5->getId();

        $message6 = new Message($channel3_ID, "null");
        $this->get("app.twake_doctrine")->persist($message6);
        $this->get("app.twake_doctrine")->flush();
        $message6_ID = $message6->getId();

        //pour le channel 4
        $message7 = new Message($channel4_ID, "null");
        $this->get("app.twake_doctrine")->persist($message7);
        $this->get("app.twake_doctrine")->flush();
        $message7_ID = $message7->getId();

        $message8 = new Message($channel4_ID, "null");
        $this->get("app.twake_doctrine")->persist($message8);
        $this->get("app.twake_doctrine")->flush();
        $message8_ID = $message8->getId();

        // ON VERIFIE ...

            //test que le user1 a acces au workspace1
        $data = Array("type" => "Workspace", "object_id" => $workspace1_id);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(true,json_decode($result->getContent(),true)["data"], "User 1 don't have acces to the workspace 1 , he should");

            //test que le user1 n'a pas acces au workspace2
        $data = Array("type" => "Workspace", "object_id" => $workspace2_id);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(false,json_decode($result->getContent(),true)["data"], "User 1 have acces to the workspace 2 , he shouldn't");


            // test que le user1 a acces au channel 1 et 2 du workspace 1


        $data = Array("type" => "Channel", "object_id" => $channel1_ID);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(true,json_decode($result->getContent(),true)["data"], "User 1 don't have acces to the channel 1 , he should");


        $data = Array("type" => "Channel", "object_id" => $channel2_ID);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(true,json_decode($result->getContent(),true)["data"], "User 1 don't have acces to the channel 2 , he should");


            // test que le user1 n'a pas acces au channel 2 et 3 du workspace 2
        $data = Array("type" => "Channel", "object_id" => $channel3_ID);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(false,json_decode($result->getContent(),true)["data"], "User 1 have acces to the channel 3 , he shouldn't");


        $data = Array("type" => "Channel", "object_id" => $channel4_ID);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(false,json_decode($result->getContent(),true)["data"], "User 1 have acces to the channel 4 , he shouldn't");

            //test que le user1 a acces au message 1 par exemple (doit aussi fonctionner avec les messages 2, 3 et 4)
        $data = Array("type" => "Message", "object_id" => $message1_ID);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(true,json_decode($result->getContent(),true)["data"], "User 1 don't have acces to the message 1 , he should");

            //test que le user 1 n'a pas acces au message 5 par exemple (doit aussi fonctionner aves les messages 6, 7 et 8)
        $data = Array("type" => "Message", "object_id" => $message5_ID);

        $result = $this->doPost("/ajax/core/access", Array(
            "data" => $data
        ));

        $this->assertEquals(false,json_decode($result->getContent(),true)["data"], "User 1 have acces to the message 1 , he shouldn't");



        // ON SUPPRIME TOUT CE QU ON A CREE ET ON VERIFIE QUE LES ENTITES SUPPRIMEES N EXISTENT PLUS

            // pour les messages
        $message1 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message1->getId().""));
        $this->get("app.twake_doctrine")->remove($message1);
        $this->get("app.twake_doctrine")->flush();

        $message1 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message1->getId().""));
        $this->assertEquals(null,$message1);

        $message2 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message2->getId().""));
        $this->get("app.twake_doctrine")->remove($message2);
        $this->get("app.twake_doctrine")->flush();

        $message2 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message2->getId().""));
        $this->assertEquals(null,$message2);

        $message3 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message3->getId().""));
        $this->get("app.twake_doctrine")->remove($message3);
        $this->get("app.twake_doctrine")->flush();

        $message3 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message3->getId().""));
        $this->assertEquals(null,$message3);

        $message4 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message4->getId().""));
        $this->get("app.twake_doctrine")->remove($message4);
        $this->get("app.twake_doctrine")->flush();

        $message4 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message4->getId().""));
        $this->assertEquals(null,$message4);

        $message5 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message5->getId().""));
        $this->get("app.twake_doctrine")->remove($message5);
        $this->get("app.twake_doctrine")->flush();

        $message5 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message5->getId().""));
        $this->assertEquals(null,$message5);

        $message6 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message6->getId().""));
        $this->get("app.twake_doctrine")->remove($message6);
        $this->get("app.twake_doctrine")->flush();

        $message6 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message6->getId().""));
        $this->assertEquals(null,$message6);

        $message7 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message7->getId().""));
        $this->get("app.twake_doctrine")->remove($message7);
        $this->get("app.twake_doctrine")->flush();

        $message7 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message7->getId().""));
        $this->assertEquals(null,$message7);

        $message8 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message8->getId().""));
        $this->get("app.twake_doctrine")->remove($message8);
        $this->get("app.twake_doctrine")->flush();

        $message8 = $this->get("app.twake_doctrine")->getRepository("TwakeDiscussionBundle:Message")->findOneBy(Array("id" => $message8->getId().""));
        $this->assertEquals(null,$message8);


        // pour les channels
        $channel1 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel1->getId().""));
        $this->get("app.twake_doctrine")->remove($channel1);
        $this->get("app.twake_doctrine")->flush();

        $channel1 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel1->getId().""));
        $this->assertEquals(null,$channel1);

        $channel2 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel2->getId().""));
        $this->get("app.twake_doctrine")->remove($channel2);
        $this->get("app.twake_doctrine")->flush();

        $channel2 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel2->getId().""));
        $this->assertEquals(null,$channel2);

        $channel3= $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel3->getId().""));
        $this->get("app.twake_doctrine")->remove($channel3);
        $this->get("app.twake_doctrine")->flush();

        $channel3 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel3->getId().""));
        $this->assertEquals(null,$channel3);

        $channel4 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel4->getId().""));
        $this->get("app.twake_doctrine")->remove($channel4);
        $this->get("app.twake_doctrine")->flush();

        $channel4 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel4->getId().""));
        $this->assertEquals(null,$channel4);

//        // pour les worskspaceUser
        $workspaceUser1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace" => $workspace1_id));
        $this->get("app.twake_doctrine")->remove($workspaceUser1);
        $this->get("app.twake_doctrine")->flush();

        $workspaceUser1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace" => $workspace1_id));
        $this->assertEquals(null,$workspaceUser1);

        $workspaceUser2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("workspace" => $workspace2_id));
        $this->get("app.twake_doctrine")->remove($workspaceUser2);
        $this->get("app.twake_doctrine")->flush();

        $workspaceUser2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUSer")->findOneBy(Array("workspace" => $workspace2_id));
        $this->assertEquals(null,$workspaceUser2);

        // pour les users
        $mail1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("user" => $user1_id));
        $this->get("app.twake_doctrine")->remove($mail1);
        $this->get("app.twake_doctrine")->flush();

        $mail2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("user" => $user2_id));
        $this->get("app.twake_doctrine")->remove($mail2);
        $this->get("app.twake_doctrine")->flush();

        $mail1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("user" => $user1_id));
        $this->assertEquals(null,$mail1);

        $mail2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:Mail")->findOneBy(Array("user" => $user2_id));
        $this->assertEquals(null,$mail2);

        $user1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user1_id));
        $this->get("app.twake_doctrine")->remove($user1);
        $this->get("app.twake_doctrine")->flush();

        $user1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user1_id));
        $this->assertEquals(null,$user1);

        $user2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user2_id));
        $this->get("app.twake_doctrine")->remove($user2);
        $this->get("app.twake_doctrine")->flush();

        $user2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user2_id));
        $this->assertEquals(null,$user2);

        // pour les worskspaces
        $workspace1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace1->getId().""));
        $this->get("app.twake_doctrine")->remove($workspace1);

        $workspace2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace2->getId().""));
        $this->get("app.twake_doctrine")->remove($workspace2);

        // pour le groupe
        $group = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group->getId().""));
        $this->get("app.twake_doctrine")->remove($group);
        $this->get("app.twake_doctrine")->flush();


        $group = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group->getId().""));
        $this->assertEquals(null,$group);

        $workspace1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace1->getId().""));
        $this->assertEquals(null,$workspace1);

        $workspace2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace2->getId().""));
        $this->assertEquals(null,$workspace2);

    }
}