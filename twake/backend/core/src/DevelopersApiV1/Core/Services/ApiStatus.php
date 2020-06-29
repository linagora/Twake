<?php
/**
 * Created by PhpStorm.
 * User: lucie
 * Date: 07/06/18
 * Time: 15:51
 */

namespace DevelopersApiV1\Core\Services;

use App\App;

class ApiStatus
{
    private $map;

    /**
     * ApiStatus constructor.
     */
    public function __construct(App $app)
    {
        //0 < General errors < 1000
        $this->map[1] = "Incorrect authentification";
        $this->map[2] = "You have not the rights to perform this action";
        $this->map[3] = "Token not found";

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
        $this->map[2016] = "The content of the file has not been set";

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
        $this->map[4000] = " No content in the request ";
        $this->map[4001] = " Fail to create a calendar";
        $this->map[4002] = " Fail to delete a calendar";
        $this->map[4003] = " Fail to edit a calendar";
        $this->map[4004] = " Fail to get a calendar";
        $this->map[4005] = " Fail to share a calendar";
        $this->map[4006] = " Fail to unshare a calendar ";
        $this->map[4007] = " Fail to create an event ";
        $this->map[4008] = " Fail to delete an event ";
        $this->map[4009] = " Fail to edit an event ";
        $this->map[4009] = " Fail to get an event ";
        $this->map[4011] = " Fail to share an event ";
        $this->map[4012] = " Fail to unshare an event ";
        $this->map[4013] = " Fail to get all events ";
        $this->map[4014] = " Fail to get all calendars ";
        $this->map[4015] = " Fail to generate calenda ";
    }

    public function getError($code)
    {
        $message = $this->map[$code];
        $response = Array("status" => "error", "code" => $code, "message" => $message);
        return $response;
    }

    public function getSuccess()
    {
        $response = Array("status" => "success");
        return $response;
    }

}