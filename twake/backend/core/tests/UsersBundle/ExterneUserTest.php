<?php

namespace Tests\AccessBundle;

require_once __DIR__ . "/../WebTestCaseExtended.php";

use Tests\WebTestCaseExtended;
use Twake\Channels\Entity\Channel;
use Twake\Channels\Entity\ChannelMember;
use Twake\Users\Entity\User;
use Twake\Workspaces\Entity\WorkspaceUser;
use Twake\Workspaces\Entity\Workspace;
use Twake\Workspaces\Entity\Group;
use Twake\Workspaces\Entity\WorkspaceLevel;

class ExterneUserTest extends WebTestCaseExtended
{
    public function testWexterne()
    {
        list($g1, $w1, $c1, $u1) = $this->getStuff();
        $u2 = $this->newUserByName("usertest002");
        $this->login($u1->getUsernameCanonical());
        $result = $this->doPost("/ajax/workspace/members/addlist", Array("list" => $u2->getUsernameCanonical() . "|1", "workspaceId" => $w1->getId()));
        $this->assertEquals(Array($u2->getUsernameCanonical()), $result["data"]["added"]["user"], "User2 not invited");
        // on se connecte à u2 pour voir ce qu'il en est
        $this->assertEquals(true, $this->verifyIfUserIsInChannel($u2, $w1, $c1, true), "u2 is not invited as wexterne");
    }

    public function testChainvite()
    {
        list($g1, $w1, $c1, $u1) = $this->getStuff();
        $u3 = $this->newUserByName("usertest003");
        $this->login($u1->getUsernameCanonical());
        $result = $this->updateChainviteFromFront($w1, $c1, $u1, [$u3->getId()], []);
        $this->assertEquals(true, $this->verifyIfUserIsInChannel($u3, $w1, $c1, true), "u3 is not invited as chanvité");
        $this->updateChainviteFromFront($w1, $c1, $u1, [], [$u3->getId()]);
        $this->assertEquals(false, $this->verifyIfUserIsInChannel($u3, $w1, $c1, true), "u3 is still invited as chanvité");
    }

    public function testChainviteMail()
    {
        list($g1, $w1, $c1, $u1) = $this->getStuff();
        $mail1 = "mail1@benoit.best";
        $mailEntity = $this->getDoctrine()->getRepository("Twake\Users:Mail")->findOneBy(Array("mail" => $mail1));
        if ($mailEntity) {
            if ($mailEntity->getUserId()) {
                $groupUsers = $this->getDoctrine()->getRepository("Twake\Workspaces:GroupUser")->findBy(Array("user" => $mailEntity->getUserId()));
                foreach ($groupUsers as $groupUser) {
                    $this->getDoctrine()->remove($groupUser);
                }
                $user = $this->getDoctrine()->getRepository("Twake\Users:User")->find($mailEntity->getUserId());
                $this->getDoctrine()->remove($user);
            }
            $this->getDoctrine()->remove($mailEntity);
        }
        $this->getDoctrine()->flush();
        $this->updateChainviteFromFront($w1, $c1, $u1, [$mail1], []);
        $u4 = $this->newUserByName("usertest004", $mail1);
        $this->assertEquals(true, $this->verifyIfUserIsInChannel($u4, $w1, $c1, true), "u4 is not invited as chanvité");
        // on vérifi que $mail1 n'est plus dans la liste
        $this->assertEquals(false, $this->verifyIfUserIsInChannel($u4, $w1, $c1, true, $mail1), "mail1 is still invited as chanvité");
    }

    public function testRemoveAutoAddFromChannel()
    {
        list($g1, $w1, $c1, $u1) = $this->getStuff();
        $u2 = $this->newUserByName("usertest002");
        $this->login($u1->getUsernameCanonical());
        $result = $this->doPost("/ajax/workspace/members/addlist", Array("list" => $u2->getUsernameCanonical() . "|1", "workspaceId" => $w1->getId()));
        $this->updateChainviteFromFront($w1, $c1, $u1, [], [$u2->getId()]);
        $this->assertEquals(true, $this->verifyIfUserIsInChannel($u2, $w1, $c1, true), "User can be remove from channel as wexterne");
    }

    public function testRemoveAutoAddFromPrivateChannel()
    {
        list($g1, $w1, $c1, $u1) = $this->getStuff();
        $c1->setPrivate(true);
        $this->getDoctrine()->persist($c1);
        $this->getDoctrine()->flush();
        $u2 = $this->newUserByName("usertest002");
        $this->login($u1->getUsernameCanonical());
        $result = $this->doPost("/ajax/workspace/members/addlist", Array("list" => $u2->getUsernameCanonical() . "|1", "workspaceId" => $w1->getId()));
        $this->assertEquals(false, $this->verifyIfUserIsInChannel($u2, $w1, $c1, true), "Wexterne is auto add in private channel");
        $this->updateChainviteFromFront($w1, $c1, $u1, [$u2->getId()], []);
        $this->assertEquals(true, $this->verifyIfUserIsInChannel($u2, $w1, $c1, true), "Wexterne can't be add in private channel");
        $this->updateChainviteFromFront($w1, $c1, $u1, [], [$u2->getId()]);
        $this->assertEquals(false, $this->verifyIfUserIsInChannel($u2, $w1, $c1, true), "Wexterne can't be remove from private channel");
    }

    public function testRemoveUserWexterne()
    {
        list($g1, $w1, $c1, $u1) = $this->getStuff();
        $this->login($u1->getUsernameCanonical());

        $u2 = $this->newUserByName("usertest002");
        $result = $this->doPost("/ajax/workspace/members/addlist", Array("list" => $u2->getUsernameCanonical() . "|1", "workspaceId" => $w1->getId()));

        $this->assertEquals(true, $this->verifyIfUserIsInChannel($u2, $w1, $c1, true), "Wexterne was not added in private channel");

        $this->login($u1->getUsernameCanonical());
        $result = $this->doPost("/ajax/workspace/members/remove", Array("ids" => Array($u2->getId()), "workspaceId" => $w1->getId()));


        $this->assertEquals(Array("removed" => 1), $result["data"]);
        $linkChannel = $this->getDoctrine()->getRepository("Twake\Channels:ChannelMember")->findOneBy(Array("direct" => false, "user_id" => $u2->getId() . "", "channel_id" => $c1->getId()));
        $this->assertNull($linkChannel, "Wexterne is still in channel (entity) on remove from workspace");
        $this->assertEquals(false, $this->verifyIfUserIsInChannel($u1, $w1, $c1, true, $u2->getUsernameCanonical()), "Wexterne is still in channel (front) on remove from workspace");
        $this->logout();
    }


    private function getStuff()
    {
        $u1 = $this->newUserByName("usertest001");
        $g1 = $this->newGroup($u1->getId(), "grptest1");
        $w1 = $this->newWorkspace("workspace1", $g1);
        $w1->setMemberCount(1);
        $this->getDoctrine()->persist($w1);
        $rightAdmin = new WorkspaceLevel();
        $rightAdmin->setIsAdmin(true);
        $rightAdmin->setWorkspace($w1);
        $this->getDoctrine()->persist($rightAdmin);
        $linkWorkspaceUser = new WorkspaceUser($w1, $u1, $rightAdmin->getId());
        $this->getDoctrine()->persist($linkWorkspaceUser);

        $c1 = $this->newChannel($g1, $w1, $u1);

        return Array($g1, $w1, $c1, $u1);
    }

    private function getChannelsFromFront($workspace, $channel, $user)
    {
        $this->login($user->getUsernameCanonical());
        $result = $this->doPost("/ajax/core/collections/init", Array(
            "collection_id" => "channels/workspace/" . $workspace->getId(),
            "options" => Array(
                "type" => "channels/workspace",
                "get_options" => Array(
                    "workspace_id" => $workspace->getId(),
                ),
                "_grouped" => true,
            )
        ));
        if (!isset($result["data"])) {
            return [];
        }
        $channels = $result["data"]["get"];
        return $channels;
    }

    private function updateChainviteFromFront($workspace, $channel, $user, $toAdd = [], $toRemove = [])
    {
        $channels = $this->getChannelsFromFront($workspace, $channel, $user);
        $frontChan = $this->getChannelById($channels, $channel->getId());
        if ($frontChan) {
            $members = $frontChan["ext_members"];
            foreach ($toAdd as $adding) {
                if (!in_array($adding, $members)) {
                    $members[] = $adding;
                }
            }
            foreach ($toRemove as $removing) {
                if (($index = array_search($removing . "", $members)) !== false) {
                    array_splice($members, $index, 1);
                }
            }
            $frontChan["ext_members"] = $members;
            $result = $this->doPost("/ajax/channels/save", Array(
                "collection_id" => "",
                "object" => $frontChan,
            ));
            return true;
        }
        return false;
    }

    private function verifyIfUserIsInChannel($user, $workspace, $channel, $hasToBeExterne, $mailOrUsername = null)
    {
        $this->login($user->getUsernameCanonical());
        $result = $this->doPost("/ajax/core/collections/init", Array(
            "collection_id" => "channels/workspace/" . $workspace->getId(),
            "options" => Array(
                "type" => "channels/workspace",
                "get_options" => Array(
                    "workspace_id" => $workspace->getId(),
                ),
                "_grouped" => true,
            )
        ));
        if (isset($result["data"]["get"])) {
            $channels = $result["data"]["get"];
        } else {
            $channels = [];
        }
        $isOk = $this->isInChannel($channels, $user, $channel, $hasToBeExterne, $mailOrUsername);
        $this->logout();
        return $isOk;
    }

    private function isInChannel($channelInWorkspace, $user, $channel, $hasToBeExterne, $mailOrUsername = null)
    {
        $chan = $this->getChannelById($channelInWorkspace, $channel->getId());
        if ($chan) {
            if ($hasToBeExterne) {
                $externeMembers = $chan["ext_members"];
                foreach ($externeMembers as $ext) {
                    if ($mailOrUsername) {
                        if ($ext == $mailOrUsername) {
                            return true;
                        }
                    } elseif ($ext == $user->getId()) {
                        return true;
                    }
                }
            } else {
                $members = $chan["members"];
                foreach ($members as $memb) {
                    if ($memb == $user->getId()) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private function getChannelById($channelList, $channelId)
    {
        if (is_array($channelList)) {
            foreach ($channelList as $chan) {
                if ($chan["id"] == $channelId) {
                    return $chan;
                }
            }
        }
        return false;
    }
}