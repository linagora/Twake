<?php
/**
 * Created by PhpStorm.
 * User: Syma
 * Date: 13/06/2017
 * Time: 11:16
 */

namespace WebsiteApi\UsersBundle\Services;


class deleteUser
{
    var $doctrine;
    function getDoctrine(){
        return $this->doctrine;
    }
    function __construct($doctrine){
        $this->doctrine = $doctrine;
    }

    public function deleteUser($uid){

        // Suppression des liens avec les organisations
        $RLinkOrgaUser = $this->getDoctrine()->getRepository("TwakeOrganizationsBundle:LinkOrgaUser");
        $links = $RLinkOrgaUser->findBy(Array("User" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }


        // Suppression des liens avec les channels
        $Rchannel_member = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:ChannelMember");
        $links = $Rchannel_member->findBy(Array("user" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }


        // Suppression des messages envoyés et reçus
        $RMessage = $this->getDoctrine()->getRepository("TwakeDiscussionBundle:Message");
        $links = $RMessage->findBy(Array("sender" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $links = $RMessage->findBy(Array("userReceiver" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $RFile = $this->getDoctrine()->getRepository("TwakeUploadBundle:File");
        $links = $RFile->findBy(Array("owner" => $uid));

        foreach($links as $link){
            $link->deleteFromDisk();
            $this->getDoctrine()->remove($link);
        }

        $RContact = $this->getDoctrine()->getRepository("TwakeUsersBundle:Contact");
        $links = $RContact->findBy(Array("userA" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $links = $RContact->findBy(Array("userB" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $RMail = $this->getDoctrine()->getRepository("TwakeUsersBundle:Mail");
        $links = $RMail->findBy(Array("user" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $RNotif = $this->getDoctrine()->getRepository("TwakeUsersBundle:Notification");
        $links = $RNotif->findBy(Array("user" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $links = $RNotif->findBy(Array("fromUser" => $uid));

        foreach($links as $link){
            $this->getDoctrine()->remove($link);
        }

        $repo = $this->getDoctrine()->getRepository("TwakeUsersBundle:User");
        $user = $repo->findOneBy(Array("id" => $uid));
        $this->getDoctrine()->remove($user);
        $this->getDoctrine()->flush();

    }
}