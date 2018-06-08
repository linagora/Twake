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
        $this->map[1000] = "The workspace does not exist or is incorrect";
        $this->map[1001] = "Array empty. The workspace is incorrect";
        $this->map[1002] = "No level found";

        //1999 < errors from Drive < 3000
        $this->map[2000] = "The file have not been created";
        $this->map[2001] = "The file does not exist in this workspace or is not accessible";
        $this->map[2002] = "The file or the folder was not deleted";
        $this->map[2003] = "The file or the folder has not been thrown away";
        $this->map[2004] = "The file or the folder has not been restored";
        $this->map[2005] = "The content of the trash has not been restored";
        $this->map[2006] = "The trash has not been emptied";
        $this->map[2007] = "Failed to get informations";
        $this->map[2008] = "No content and no url has been given";
        $this->map[2009] = "The folder has not been shared";
        $this->map[2010] = "The folder has not been unshared";
        $this->map[2011] = "The file has not been renamed";
        $this->map[2012] = "The array is empty";
        $this->map[2013] = "The search is impossible";
        $this->map[2014] = "Impossible to return the list of files contained into the folder";
        $this->map[2015] = "The file has not been moved";

        //2999 < errors from Messages < 4000
        $this->map[3000] = "You can't access to this stream";
        $this->map[3001] = "You can't access to this message";
        $this->map[3002] = "Failed to post";
        $this->map[3003] = "Fail to get message";
        $this->map[3004] = "Fail to get message children";
        $this->map[3005] = "Fail to edit a message";
        $this->map[3006] = "Fail to delete a message";
        $this->map[3007] = "Fail to get stream content";
        $this->map[3008] = "";
        $this->map[3009] = "Fail to get stream list";
        $this->map[3010] = "Fail to change message in subject";
        $this->map[3011] = "Fail to move a message in a message";
        $this->map[3012] = "";
        $this->map[3013] = "Fail to close a subject";
        $this->map[3014] = "Fail to move message in subject";
        $this->map[3015] = "Fail to delete a stream";
        $this->map[3016] = "Fail to create a stream";
        $this->map[3017] = "Fail to edit a stream";
        $this->map[3018] = "";
        $this->map[3019] = "Fail to add a member";
        $this->map[3020] = "Fail to remove a member";
        $this->map[3021] = "Fail to edit a subject";
        $this->map[3022] = "Fail to get all subjects from a stream";

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