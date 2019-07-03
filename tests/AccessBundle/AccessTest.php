<?php

namespace Tests\DriveBundle;

use Tests\WebTestCaseExtended;
use WebsiteApi\ChannelsBundle\Entity\Channel;
use WebsiteApi\DiscussionBundle\Entity\Message;
use WebsiteApi\UsersBundle\Entity\User;
use WebsiteApi\WorkspacesBundle\Entity\WorkspaceUser;

class DriveCollectionTest extends WebTestCaseExtended
{
    public function testSAccess(){

        // ON CREE UN GROUP POUR CREER NOS DEUX WORKSPACES
        $group = new Group("group_for_test");
        $this->get("app.twake_doctrine")->persist($group);

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

        // ON CREE DEUX USERS

            //un lie au workspace1
        $user1 = new User();
        $this->get("app.twake_doctrine")->persist($user1);
        $this->get("app.twake_doctrine")->flush();
        $user1_id = $user1->getId()."";

            //l'autre lie au workspace2
        $user2 = new User();
        $this->get("app.twake_doctrine")->persist($user2);
        $this->get("app.twake_doctrine")->flush();
        $user2_id = $user2->getId()."";

        // POUR FAIRE LE LIEN ENTRE LE USER1 ET LE WORKSPACE 1 (RESPECTIVEMENT USER2 WORKSPACE2) -> ON CREE DEUX WORKSPACEUSERS

            //creation workspaceUser1
        $workspaceUser1 = new WorkspaceUser($workspace1, $user1, null);
        $this->get("app.twake_doctrine")->persist($workspaceUser1);
        $this->get("app.twake_doctrine")->flush();
        $worspaceUser1_id = $workspaceUser1->getId()."";

        //creation workspaceUser2
        $workspaceUser2 = new WorkspaceUser($workspace2, $user2, null);
        $this->get("app.twake_doctrine")->persist($workspaceUser2);
        $this->get("app.twake_doctrine")->flush();
        $workspaceUser2_id = $workspaceUser2->getId()."";


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
        $message1 = new Message($channel1_ID, null);
        $this->get("app.twake_doctrine")->persist($message1);
        $this->get("app.twake_doctrine")->flush();
        $message1_ID = $message1->getId();

        $message2 = new Message($channel1_ID, null);
        $this->get("app.twake_doctrine")->persist($message2);
        $this->get("app.twake_doctrine")->flush();
        $message2_ID = $message2->getId();

        //pour le channel 2
        $message3 = new Message($channel2_ID, null);
        $this->get("app.twake_doctrine")->persist($message3);
        $this->get("app.twake_doctrine")->flush();
        $message3_ID = $message3->getId();

        $message4 = new Message($channel2_ID, null);
        $this->get("app.twake_doctrine")->persist($message4);
        $this->get("app.twake_doctrine")->flush();
        $message4_ID = $message4->getId();

        //pour le channel 3
        $message5 = new Message($channel3_ID, null);
        $this->get("app.twake_doctrine")->persist($message5);
        $this->get("app.twake_doctrine")->flush();
        $message5_ID = $message5->getId();

        $message6 = new Message($channel3_ID, null);
        $this->get("app.twake_doctrine")->persist($message6);
        $this->get("app.twake_doctrine")->flush();
        $message6_ID = $message6->getId();

        //pour le channel 4
        $message7 = new Message($channel4_ID, null);
        $this->get("app.twake_doctrine")->persist($message7);
        $this->get("app.twake_doctrine")->flush();
        $message7_ID = $message7->getId();

        $message8 = new Message($channel4_ID, null);
        $this->get("app.twake_doctrine")->persist($message8);
        $this->get("app.twake_doctrine")->flush();
        $message8_ID = $message8->getId();

        // ON VERIFIE ...

        // ON SUPPRIME TOUT CE QU ON A CREE ET ON VERIFIE QUE LES ENTITES SUPPRIMEES N EXISTENT PLUS

            // pour le groupe
        $group = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group->getId().""));
        $this->get("app.twake_doctrine")->remove($group);
        $this->get("app.twake_doctrine")->flush();

        $group = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Group")->findOneBy(Array("id" => $group->getId().""));
        $this->assertEquals(null,$group);

            // pour les worskspaces
        $workspace1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace1->getId().""));
        $this->get("app.twake_doctrine")->remove($workspace1);
        $this->get("app.twake_doctrine")->flush();

        $workspace1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace1->getId().""));
        $this->assertEquals(null,$workspace1);

        $workspace2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace2->getId().""));
        $this->get("app.twake_doctrine")->remove($workspace2);
        $this->get("app.twake_doctrine")->flush();

        $workspace2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:Workspace")->findOneBy(Array("id" => $workspace2->getId().""));
        $this->assertEquals(null,$workspace2);

            // pour les users
        $user1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user1->getId().""));
        $this->get("app.twake_doctrine")->remove($user1);
        $this->get("app.twake_doctrine")->flush();

        $user1 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user1->getId().""));
        $this->assertEquals(null,$user1);

        $user2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user2->getId().""));
        $this->get("app.twake_doctrine")->remove($user2);
        $this->get("app.twake_doctrine")->flush();

        $user2 = $this->get("app.twake_doctrine")->getRepository("TwakeUsersBundle:User")->findOneBy(Array("id" => $user2->getId().""));
        $this->assertEquals(null,$user2);

            // pour les worskspaceUser
        $workspaceUser1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("id" => $workspaceUser1->getId().""));
        $this->get("app.twake_doctrine")->remove($workspaceUser1);
        $this->get("app.twake_doctrine")->flush();

        $workspaceUser1 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("id" => $workspaceUser1->getId().""));
        $this->assertEquals(null,$workspaceUser1);

        $workspaceUser2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUser")->findOneBy(Array("id" => $workspaceUser2->getId().""));
        $this->get("app.twake_doctrine")->remove($workspaceUser2);
        $this->get("app.twake_doctrine")->flush();

        $workspaceUser2 = $this->get("app.twake_doctrine")->getRepository("TwakeWorkspacesBundle:WorkspaceUSer")->findOneBy(Array("id" => $workspaceUser2->getId().""));
        $this->assertEquals(null,$workspaceUser2);

            // pour les channels
        $channel1 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel1->getId().""));
        $this->get("app.twake_doctrine")->remove($channel1);
        $this->get("app.twake_doctrine")->flush();

        $channel1 = $this->get("app.twake_doctrine")->getRepository("TwakeWChannelsBundle:Channel")->findOneBy(Array("id" => $channel1->getId().""));
        $this->assertEquals(null,$channel1);

        $channel2 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel2->getId().""));
        $this->get("app.twake_doctrine")->remove($channel2);
        $this->get("app.twake_doctrine")->flush();

        $channel2 = $this->get("app.twake_doctrine")->getRepository("TwakeWChannelsBundle:Channel")->findOneBy(Array("id" => $channel2->getId().""));
        $this->assertEquals(null,$channel2);

        $channel3= $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel3->getId().""));
        $this->get("app.twake_doctrine")->remove($channel3);
        $this->get("app.twake_doctrine")->flush();

        $channel3 = $this->get("app.twake_doctrine")->getRepository("TwakeWChannelsBundle:Channel")->findOneBy(Array("id" => $channel3->getId().""));
        $this->assertEquals(null,$channel3);

        $channel4 = $this->get("app.twake_doctrine")->getRepository("TwakeChannelsBundle:Channel")->findOneBy(Array("id" => $channel4->getId().""));
        $this->get("app.twake_doctrine")->remove($channel4);
        $this->get("app.twake_doctrine")->flush();

        $channel4 = $this->get("app.twake_doctrine")->getRepository("TwakeWChannelsBundle:Channel")->findOneBy(Array("id" => $channel4->getId().""));
        $this->assertEquals(null,$channel4);

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


    }
}