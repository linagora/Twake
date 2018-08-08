<?php
/**
 * Created by PhpStorm.
 * User: ehlnofey
 * Date: 12/06/18
 * Time: 11:14
 */

namespace WebsiteApi\DriveBundle\Services;


use WebsiteApi\UsersBundle\Entity\Token;
use Google_Client;
use Google_Service_Drive;
use Google_Service_Drive_DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;

class GDriveApiSystem
{
    private $restClient;
    private $doctrine;
    private $externalCache;
    private $marketApplication;
    private $tokenService;

    public function __construct($doctrine, $restClient, $externalCache, $marketApplication, $tokenService)
    {
        $this->restClient = $restClient;
        $this->doctrine = $doctrine;
        $this->externalCache = $externalCache;
        $this->marketApplication = $marketApplication;
        $this->tokenService = $tokenService;
    }

    private function convertToEntity($var, $repository)
    {
        if (is_string($var)) {
            $var = intval($var);
        }

        if (is_int($var)) {
            return $this->doctrine->getRepository($repository)->find($var);
        } else if (is_object($var)) {
            return $var;
        } else {
            return null;
        }

    }

    public function getClient(Token $userToken)
    {
        $client = new Google_Client();
        $client->setApplicationName('Twake Drive');
        $client->setScopes(Google_Service_Drive::DRIVE);
        $client->setAuthConfig('../app/Ressources/Apis/client_secret.json');
        $client->setAccessType('offline');

        $accessToken = $userToken->getToken();
        $client->setAccessToken(json_encode($accessToken));

        // Refresh the token if it's expired.
        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
            $userToken->setToken($client->getAccessToken());
            $this->tokenService->refreshToken($userToken);
        }
        return $client;
    }

    /**
     * Expands the home directory alias '~' to the full path.
     * @param string $path the path to expand.
     * @return string the expanded path.
     */
    public function expandHomeDirectory($path)
    {
        $homeDirectory = getenv('HOME');
        if (empty($homeDirectory)) {
            $homeDirectory = getenv('HOMEDRIVE') . getenv('HOMEPATH');
        }
        return str_replace('~', realpath($homeDirectory), $path);
    }

    public function getGDriveToken(Token $userToken){
        return $this->getClient($userToken)->getAccessToken()["access_token"];
    }

    public function getRootIdFromAuthCode($accessToken){
        $client = new Google_Client();
        $client->setApplicationName('Twake Drive');
        $client->setScopes(Google_Service_Drive::DRIVE);
        $client->setAuthConfig('../app/Ressources/Apis/client_secret.json');
        $client->setAccessType('offline');
        $data = $this->restClient->get("https://www.googleapis.com/drive/v3/files/root", array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'",
            "Authorization: Bearer " . $accessToken)));

        $content = @json_decode($data->getContent(), true);

        return $content["id"];
    }

    public function getGDriveBasicInfo($gdriveId,Token $userToken){
        $data = $this->restClient->get("https://www.googleapis.com/drive/v3/files/" . $gdriveId, array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'",
            "Authorization: Bearer " . $this->getGDriveToken($userToken))));

        $content = @json_decode($data->getContent(), true);

        return $content;
    }

    public function getHaveAccessTo($gdriveId, $userToken){
        $content = $this->getGDriveBasicInfo($gdriveId,$userToken);
        return !isset($content["error"]);
    }

    public function getGDriveFileFromGDriveId($gdriveId,Token $userToken)
    {
        $content = $this->getGDriveBasicInfo($gdriveId, $userToken);

        $service = new Google_Service_Drive($this->getClient($userToken));


        $optParams = array(
            'q' => "name = '" . addslashes($content["name"]) . "'",
            'fields' => 'nextPageToken, files(id, parents, name, shared, trashed,mimeType, description, createdTime, size, fullFileExtension, hasThumbnail,thumbnailLink,webViewLink, webContentLink)'
        );
        $results = $service->files->listFiles($optParams);

        if (count($results->getFiles()) > 0)
            return $results->getFiles()[0];

        $gfile = new Google_Service_Drive_DriveFile();

        $gfile->setName($content["name"]);
        $gfile->setId($content["id"]);
        $gfile->setMimeType($content["mimeType"]);
        $gfile->setKind($content["kind"]);

        return $gfile;
    }

    public function getDriveFileFromGDriveId($workspace, $gdriveId, Token $userToken)
    {
        $file = $this->getGDriveFileFromGDriveId($gdriveId, $userToken);
        if($file)
            return $this->getDriveFileFromGDriveFile($workspace, $file);
        else
            return false;
    }

    public function getDriveFileFromGDriveFile($workspace,Google_Service_Drive_DriveFile $file){
        $workspace = $this->convertToEntity($workspace,"TwakeWorkspacesBundle:Workspace");
        $name = $file->getName();
        $extension = $file->getFullFileExtension();

        $desription = $file->getDescription();
        $isInTrash = $file->getTrashed();
        $isShared = $file->getShared();
        $size = $file->size;

        $driveFile = new DriveFile($workspace, null, $name, $file->getMimeType()=="application/vnd.google-apps.folder");
        $driveFile->setCopyOf(false);
        $driveFile->setDescription($desription);
        $driveFile->setExtension($extension);
        $driveFile->setDetachedFile(false);
        $driveFile->setIsInTrash($isInTrash);
        $driveFile->setOldParent(null);
        $driveFile->setShared($isShared);
        $driveFile->setSize($size);
        if($file->getWebContentLink()==null)
            $driveFile->setUrl($file->getWebViewLink());
        $driveFile->setDefaultWebApp($this->marketApplication->getAppForUrl($file->getWebViewLink()));
        $lastVersion = new DriveFileVersion($driveFile, null);
        $driveFile->setLastVersion($lastVersion);
        $driveFile->setId($file->getId());
        $driveFile->setAdded(new \DateTime($file->createdTime));

        return $driveFile;
    }

    public function getArrayFromGDriveFile($file, $fields){
        $data = Array();
        /*if(in_array("",$fields))
            $data[""] = $file->get();*/
        if(in_array("id",$fields))
            $data["id"] = $file->getId();
        if(in_array("parents",$fields))
            $data["parents"] = $file->getParents();
        if(in_array("name",$fields))
            $data["name"] = $file->getName();
        if(in_array("shared",$fields))
            $data["shared"] = $file->getShared();
        if(in_array("trashed",$fields))
            $data["trashed"] = $file->getTrashed();
        if(in_array("mimeType",$fields))
            $data["mimeType"] = $file->getMimeType();
        if(in_array("description",$fields))
            $data["description"] = $file->getDescription();
        if(in_array("createdTime",$fields))
            $data["createdTime"] = $file->getCreatedTime();
        if(in_array("size",$fields))
            $data["size"] = $file->getSize();
        if(in_array("fullFileExtension",$fields))
            $data["fullFileExtension"] = $file->getFullFileExtension();
        if(in_array("hasThumbnail",$fields))
            $data["hasThumbnail"] = $file->getHasThumbnail();
        if(in_array("thumbnailLink",$fields))
            $data["thumbnailLink"] = $file->getThumbnailLink();
        if(in_array("webViewLink",$fields))
            $data["webViewLink"] = $file->getWebViewLink();
        if(in_array("webContentLink",$fields))
            $data["webContentLink"] = $file->getWebContentLink();

        return $data;
    }

    public function listFiles($workspace, $directory, Token $userToken){
        $service = new Google_Service_Drive($this->getClient($userToken));

        $list = Array();
        $pageToken = null;

        do {

            $optParams = array(
                'q' => $directory." in parents",
                //'q' => "mimeType='application/vnd.google-apps.folder'",
                'pageSize' => 100,
                'pageToken' => $pageToken,
                'fields' =>  'nextPageToken, files(id, parents, name, shared, trashed,mimeType, description, createdTime, size, fullFileExtension, hasThumbnail,thumbnailLink,webViewLink, webContentLink)'

            );
            $results = $service->files->listFiles($optParams);

            foreach ($results->getFiles() as $file) {
                $data = $this->getArrayFromGDriveFile($file,Array( "id","parents","name","shared","trashed","mimeType","description","createdTime","size","fullFileExtension","hasThumbnail","thumbnailLink","webViewLink","webContentLink"));

                $this->externalCache->update($file->getId(),"gdrive",$data);

                if(!$file->getTrashed()) {
                    $res = $this->getDriveFileFromGDriveFile($workspace, $file);

                    array_push($list, $res);
                }
            }
            $pageToken = $results->nextPageToken;

        } while ($pageToken != null);

        return $list;
    }

    public function listTrash($workspace, Token $userToken){
        $service = new Google_Service_Drive($this->getClient($userToken));

        $list = Array();
        $pageToken = null;

        do {

            $optParams = array(
                'q' => "'root' in parents",
                //'q' => "mimeType='application/vnd.google-apps.folder'",
                'pageSize' => 100,
                'pageToken' => $pageToken,
                'fields' =>  'nextPageToken, files(id, parents, name, shared, trashed,mimeType, description, createdTime, size, fullFileExtension, hasThumbnail,thumbnailLink,webViewLink, webContentLink)'

            );
            $results = $service->files->listFiles($optParams);

            foreach ($results->getFiles() as $file) {
                $data = $this->getArrayFromGDriveFile($file,Array( "id","parents","name","shared","trashed","mimeType","description","createdTime","size","fullFileExtension","hasThumbnail","thumbnailLink","webViewLink","webContentLink"));

                $this->externalCache->update($file->getId(),"gdrive",$data);

                if($file->getTrashed()) {
                    $res = $this->getDriveFileFromGDriveFile($workspace, $file);

                    array_push($list, $res);
                }
            }
            $pageToken = $results->nextPageToken;

        } while ($pageToken != null);

        return $list;
    }

    public function searchNameContains($workspace, $query, $offset, $max, Token $userToken){
        $service = new Google_Service_Drive($this->getClient($userToken));

        $list = Array();
        $index = -$max;
        $pageToken = null;

        do {
            $index += $max;
            $optParams = array(
                'q' => "name contains '".$query."'",
                //'q' => "mimeType='application/vnd.google-apps.folder'",
                'pageSize' => $max,
                'pageToken' => $pageToken,
                'fields' => 'nextPageToken, files(id, parents, name, shared, trashed,mimeType)'

            );
            $results = $service->files->listFiles($optParams);

            $pageToken = $results->nextPageToken;

        } while ($pageToken != null && $index<$offset);


        foreach ($results->getFiles() as $file) {
            $res = $this->getDriveFileFromGDriveFile($workspace, $file);

            array_push($list, $res);
        }

        return $list;
    }

    public function getPreview($fileid,Token $userToken)
    {
        $repo = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDriveDataCache");

        $fileCache = $repo->findOneBy(Array("id" => $fileid, "drive" => "gdrive"));
        if($fileCache==null)
            return null;
        $dataCache = $fileCache->getData();

        $hasThumbnail = false;
        $url = "";

        if (isset($dataCache["hasThumbnail"])) {
            $hasThumbnail = $dataCache["hasThumbnail"];
            if ($hasThumbnail)
                $url = $dataCache["thumbnailLink"];
        } else {
            $file = $this->getGDriveFileFromGDriveId($fileid, $userToken);
            if ($file) {
                $hasThumbnail = $file->getHasThumbnail();
                if ($hasThumbnail)
                    $url = $file->getThumbnailLink();
            }
        }
        if ($hasThumbnail) {
            if (strpos($url, "https://") == 0) {
                $opts = array("http" =>
                    array(
                        'method'  => 'GET',
                        'header'  =>
                            "Authorization: Bearer ".$this->getGDriveToken($userToken)
                    )
                );

                $context  = stream_context_create($opts);

                return file_get_contents($url,false,$context);
            }
        }
        return null;
    }

    public function getInfos($workspace, $fileOrDirectory, Token $userToken)
    {
        if(is_string($fileOrDirectory)) {
            $file = $this->getDriveFileFromGDriveId($workspace, $fileOrDirectory, $userToken);
            if($file)
                return $file->getAsArray();
        }
        else
            return $fileOrDirectory->getAsArray();
        return null;
    }

    public function rename($gdriveId,$filename,$description, Token $userToken){
        $data = $this->restClient->patch("https://www.googleapis.com/drive/v3/files/" . $gdriveId, '{ "name": "' . $filename . '", "description": "' . $description . '"}',
            array(CURLOPT_HTTPHEADER => Array("Authorization: Bearer " . $this->getGDriveToken($userToken), "Content-Type: application/json")));

        $content = @json_decode($data->getContent(), true);

        $this->externalCache->update($gdriveId,"gdrive",Array("name" => $filename, "description" => $description));
    }

    public function download($gdriveId){
        $repo = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDriveDataCache");

        $fileCache = $repo->findOneBy(Array("id" => $gdriveId, "drive" => "gdrive"));

        if($fileCache==null)
            return false;
        $dataCache = $fileCache->getData();

        if(isset($dataCache["webContentLink"])){
            return $dataCache["webContentLink"];
        }
        return false;
    }
    public function getOpenLink($gdriveId){
        $repo = $this->doctrine->getRepository("TwakeDriveBundle:ExternalDriveDataCache");

        $fileCache = $repo->findOneBy(Array("id" => $gdriveId, "drive" => "gdrive"));
        if($fileCache==null)
            return false;
        $dataCache = $fileCache->getData();

        if(isset($dataCache["webViewLink"])){
            return $dataCache["webViewLink"];
        }
        return false;
    }

    public function move($gdriveFileId, $gdriveFolderId, Token $userToken){
        $service = new Google_Service_Drive($this->getClient($userToken));

        $fileId = $gdriveFileId;
        $folderId = $gdriveFolderId;
        $emptyFileMetadata = new Google_Service_Drive_DriveFile();
        // Retrieve the existing parents to remove
        $file = $service->files->get($fileId, array('fields' => 'parents'));
        $previousParents = join(',', $file->parents);
        // Move the file to the new folder
        $file = $service->files->update($fileId, $emptyFileMetadata, array(
            'addParents' => $folderId,
            'removeParents' => $previousParents,
            'fields' => 'id, parents'));

        return $file;
    }

    public function upload($file, $directory, Token $userToken){
        $service = new Google_Service_Drive($this->getClient($userToken));

        $fileMetadata = new Google_Service_Drive_DriveFile(array(
            'name' => $file["name"]));

        $content = file_get_contents($file["tmp_name"]);

        $file = $service->files->create($fileMetadata, array(
            'data' => $content,
            'mimeType' => $file["type"],
            'uploadType' => 'multipart',
            'fields' => 'id'));

        if($directory!=0) {
            $file = $this->move($file->getId(), $directory);
        }

        return $file;
    }

    public function delete($gdriveId, Token $userToken){
        $data = $this->restClient->delete("https://www.googleapis.com/drive/v3/files/" . $gdriveId,
            array(CURLOPT_HTTPHEADER => Array("'Content-Type: application/json'", "Authorization: Bearer " . $this->getGDriveToken($userToken))));

        return $data;
    }

    public function setTrashed($gdriveId, $trashed, Token $userToken){
        $trashed = $trashed ? "true" : "false";
        $data = $this->restClient->patch("https://www.googleapis.com/drive/v3/files/" . $gdriveId, '{ "trashed": ' . $trashed . '}',
            array(CURLOPT_HTTPHEADER => Array("Authorization: Bearer " . $this->getGDriveToken($userToken), "Content-Type: application/json")));

        $content = @json_decode($data->getContent(), true);

        return $content;
    }

    public function watchFile($gdriveID, $workspaceId, Token $userToken){
        $webSiteAddress = "fd244445.ngrok.io";
        $json = "{
                  \"kind\": \"api#channel\",
                  \"id\": \"".$gdriveID."/".$workspaceId."\",
                  \"type\": \"web_hook\",
                  \"address\": \"https://".$webSiteAddress."/ajax/drive/users_to_notify/post_gdrive_notification\"
                }";

        $data = $this->restClient->post("https://www.googleapis.com/drive/v3/files/" . $gdriveID . '/watch', $json,
            array(CURLOPT_HTTPHEADER => Array("Authorization: Bearer " . $this->getGDriveToken($userToken), "Content-Type: application/json")));

        return json_decode($data->getContent(),true);
    }
    public function unwatchFile($gdriveID, $workspaceId, Token $userToken, $resourceId){
        $json = "{
                  \"kind\": \"api#channel\",
                  \"id\": \"".$gdriveID."/".$workspaceId."\",
                  \"resourceId\":\"".$resourceId."\",
                  \"type\": \"web_hook\"
                }";

        $data = $this->restClient->post("https://www.googleapis.com/drive/v3/channels/stop", $json,
            array(CURLOPT_HTTPHEADER => Array("Authorization: Bearer " . $this->getGDriveToken($userToken), "Content-Type: application/json")));

        return $data;
    }
}