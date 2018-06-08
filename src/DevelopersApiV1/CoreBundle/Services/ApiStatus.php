<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 07/06/18
 * Time: 15:51
 */

namespace DevelopersApiV1\CoreBundle\Services;


class ApiStatus {
    private $map;

    /**
     * ApiStatus constructor.
     */
    public function __construct(){
        //0 < General errors < 1000
        $this->map[1] = "Incorrect authentification";
        $this->map[2] = "You have not the rights to perform this action";

        //999 < errors from Workspace < 2000

        //1999 < errors from Drive < 3000
        $this->map[2000] = "The file have not been created";
        $this->map[2001] = "The file does not exist in this workspace or is not accessible";
        $this->map[2002] = "The file or the folder was not deleted";
        $this->map[2003] = "The file or the folder has not been thrown away";
        $this->map[2004] = "The file or the folder has not been restored";
        $this->map[2005] = "The content of the trash has not been restored";

        //2999 < errors from Messages < 4000
        $this->map[3000] = "Stream not found";
        $this->map[3001] = "Message not found";
        $this->map[3002] = "Failed to post message";
        $this->map[3003] = "Failed to get message";
        $this->map[3004] = "Failed to get message children";
        $this->map[3005] = "Failed to edit a message";
        $this->map[3006] = "Failed to delete a message";
        $this->map[3007] = "Failed to get stream content";
        $this->map[3008] = "";
        $this->map[3009] = "Failed to get stream list";
        $this->map[3010] = "Failed to change message in subject";
        $this->map[3011] = "Failed to move a message in a message";
        $this->map[3012] = "";
        $this->map[3013] = "Failed to close a subject";
        $this->map[3014] = "Failed to move message in subject";
        $this->map[3015] = "Failed to delete a stream";
        $this->map[3016] = "Failed to create a stream";
        $this->map[3017] = "Failed to edit a stream";
        $this->map[3018] = "";
        $this->map[3019] = "Failed to add a member";
        $this->map[3020] = "Failed to remove a member";
        $this->map[3021] = "Failed to edit a subject";
        $this->map[3022] = "Failed to get all subjects from a stream";

        //3999 < errors from Calendar < 5000
    }

    public function getError($code){
        $message = $this->map[$code];
        $response = Array("status" => "error", "code" => $code,"message" => $message);
        return $response;
    }

    public function getSuccess(){
        $response = Array("status" => "success");
        return $response;
    }

}