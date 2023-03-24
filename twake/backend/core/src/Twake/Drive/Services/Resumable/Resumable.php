<?php

namespace Twake\Drive\Services\Resumable;

use Twake\Core\Services\Queues\Adapters\QueueManager;
use Twake\Drive\Entity\UploadState;
use Twake\Drive\Services\DriveFile;
use Twake\Drive\Services\Storage\EncryptionBag;
use App\App;

class Resumable
{
    const WITHOUT_EXTENSION = true;
    public $debug = false;
    public $tempFolder = 'tmp';
    // for testing
    public $uploadFolder = 'test/files/uploads';
    public $deleteTmpFolder = true;
    protected $request;
    protected $response;
    protected $params;
    protected $chunkFile;
    protected $filename;
    protected $filepath;
    protected $extension;
    protected $originalFilename;
    protected $isUploadComplete = false;
    protected $resumableOption = [
        'identifier' => 'identifier',
        'filename' => 'filename',
        'chunkNumber' => 'chunkNumber',
        'chunkSize' => 'chunkSize',
        'totalSize' => 'totalSize',
        'query' => 'query',
        'parent_id' => 'parent_id'
    ];
    protected $storagemanager;
    protected $doctrine;
    protected $driverefacto;
    protected $current_user;
    protected $previews;
    protected $parameter_drive_salt;
    /** @var QueueManager */
    protected $queues;

    public function __construct(App $app)
    {
        $this->queues = $app->getServices()->get("app.queues")->getAdapter();
        $this->doctrine = $app->getServices()->get("app.twake_doctrine");
        $this->storagemanager = $app->getServices()->get("driveupload.storemanager");
        $this->driverefacto = $app->getServices()->get("app.drive");
        $this->previews = $app->getContainer()->getParameter("storage.drive_previews_tmp_folder");
        $this->tempFolder = $app->getContainer()->getParameter("storage.drive_tmp_folder");
        $this->parameter_drive_salt = $app->getContainer()->getParameter("storage.drive_salt");
    }

    public function setResumableOption(array $resumableOption)
    {
        $this->resumableOption = array_merge($this->resumableOption, $resumableOption);
    }

    // sets original filename and extenstion etc
    public function process($current_user)
    {

        if (!empty($this->resumableParams())) {
            if (!empty($this->request->file())) {
                $this->current_user_id = $current_user;
                return $this->handleChunk();
            } else {
                $this->handleTestChunk();
            }
        }
    }

    public function resumableParams()
    {
        if ($this->request->is('get')) {
            return $this->request->data('get');
        }
        if ($this->request->is('post')) {
            return $this->request->data('post');
        }
    }

    public function handleChunk($file_or_url = null, $filename = null, $totalSize = null, $identifier = null, $chunkNumber = null, $numOfChunks = null, $object_from_caller = null, $options_from_caller = null)
    {

        //  VERIFIER IDENTIFIER QU ON A BIEN QUE DES CHIFFRES ET DES LETTRES ET PAS UN REQUETE OU AUTRES.
        $file = $file_or_url !== null ? $file_or_url : $this->request->file();
        $identifier = $identifier ? $identifier : $this->resumableParam($this->resumableOption['identifier']);
        $filename = $filename !== null ? $filename : $this->resumableParam($this->resumableOption['filename']);
        $chunkNumber = $chunkNumber ? $chunkNumber : $this->resumableParam($this->resumableOption['chunkNumber']);
        $totalSize = $totalSize !== null ? $totalSize : intval($_POST["resumableTotalSize"]);
        $numOfChunks = $numOfChunks ? $numOfChunks : intval($_POST["resumableTotalChunks"]);


        $finalname = $identifier . ".chunk_" . $chunkNumber;

        if (!$this->isChunkUploaded($identifier, $finalname, $chunkNumber)) {

            $uploadstate = $this->doctrine->getRepository("Twake\Drive:UploadState")->findOneBy(Array("identifier" => $identifier));
            $param_bag = new EncryptionBag($uploadstate->getEncryptionKey(), $uploadstate->getEncryptionSalt(), $uploadstate->getEncryptionMode());

            if ($this->current_user_id != $uploadstate->getUserId()) {
                return false;
            }

            $chunkFile = $this->tmpChunkDir() . DIRECTORY_SEPARATOR . $finalname;

            $do_preview = ($numOfChunks == 1 && $chunkNumber == 1 && $totalSize < 50000000);

            if (!$this->storagemanager->getAdapter($uploadstate->getStorageProvider())->streamModeIsAvailable() || $do_preview) {

                if (is_string($file)) {
                    if (strpos($file, "http://") === 0 || strpos($file, "https://") === 0) {
                        try{
                            $newContent = fopen($file, 'r', false, stream_context_create(array(
                                "ssl"=>array(
                                    "verify_peer"=>false,
                                    "verify_peer_name"=>false,
                                ),
                            )));
                        }catch(\Exception $e){
                            error_log("Error while downloading file from url : " . $file);
                            return;
                        }
                        file_put_contents($chunkFile, $newContent);
                    }
                } else {
                    $this->moveUploadedFile($file['tmp_name'], $chunkFile);
                }

                if ($file_or_url && $numOfChunks == 1) {
                    $totalSize = filesize($chunkFile);
                }

                //Preview if only one chunk
                if ($do_preview) {
                    $previewDestination = $this->previews . DIRECTORY_SEPARATOR . "preview_" . $finalname;
                    $this->copy($chunkFile, $previewDestination);
                    $uploadstate->setHasPreview(true);
                    $this->doctrine->persist($uploadstate);
                    $this->doctrine->flush();
                }

            } else {
                $chunkFile = $file['tmp_name'];
            }


            $this->storagemanager->getAdapter($uploadstate->getStorageProvider())->write($chunkFile, $chunkNumber, $param_bag, $uploadstate);
            $this->doctrine->clear();

            $chunktoadd = "chunk_" . $chunkNumber;
            $uploadstate = $this->doctrine->getRepository("Twake\Drive:UploadState")->findOneBy(Array("identifier" => $identifier));
            $uploadstate->addChunk($chunktoadd);
            $this->doctrine->persist($uploadstate);
            $this->doctrine->flush();

        }

        if (isset($uploadstate) && $uploadstate->getChunk() == $numOfChunks && count($uploadstate->getChunklist()) == $numOfChunks) {

            $this->isUploadComplete = true;
            $uploadstate->setSuccess(true);
            $uploadstate->setChunk($chunkNumber);
            $this->doctrine->persist($uploadstate);
            $this->doctrine->flush();

            $object = Array();
            if ($object_from_caller) {
                $object = $object_from_caller;
            } else {
                $object = json_decode($_POST['object'], 1);

            }

            $data = Array("upload_mode" => "chunk", "identifier" => $identifier, "nb_chunk" => $chunkNumber);

            //TODO What if we uploaded to an existing object (object[id] is set) TODO->REMOVE OLD VERSION IF WE ARE NOT CREATING A NEW ONE (or each time onlyoffice write we add a new copy on S3)

            $this->driverefacto->setDriveResumable($this);
            $fileordirectory = $this->driverefacto->save($object, $options_from_caller, $current_user, Array("provider" => $uploadstate->getStorageProvider(), "data" => $data, "size" => $totalSize), true);

            if ($uploadstate->getHasPreview() && $totalSize < 20000000) {
                $this->storagemanager->getAdapter($uploadstate->getStorageProvider())->genPreview($fileordirectory, $previewDestination);
            } else {
                $this->queues->push("drive_preview_to_generate", [
                    "file_id" => $fileordirectory->getId()
                ]);
            }
            $fileToReturn = $fileordirectory->getAsArray();
            if (!$fileordirectory->getIsDirectory()) {
                $versions = $this->driverefacto->getFileVersion($fileordirectory, true);
                $fileToReturn["versions"] = $versions;
                return $fileToReturn;
            }
            return $fileordirectory->getAsArray();

        }
        return true;
    }

    private function resumableParam($shortName)
    {
        $resumableParams = $this->resumableParams();
        if (!isset($resumableParams['resumable' . ucfirst($shortName)])) {
            return null;
        }
        return $resumableParams['resumable' . ucfirst($shortName)];
    }

    public function isChunkUploaded($identifier, $filename, $chunkNumber)
    {
        $part = explode("_", $filename)[0];
        $chemin = $this->tmpChunkDir($identifier) . DIRECTORY_SEPARATOR . $part . "_" . $chunkNumber;

        return file_exists($chemin);
    }

    public function tmpChunkDir()
    {
        //$tmpChunkDir = $this->tempFolder . DIRECTORY_SEPARATOR . $identifier;
        $tmpChunkDir = $this->tempFolder;
        //error_log($tmpChunkDir);
        if (!file_exists($tmpChunkDir)) {
            mkdir($tmpChunkDir);
        }
        return $tmpChunkDir;
    }

    public function moveUploadedFile($file, $destFile)
    {
        if (file_exists($file)) {
            return copy($file, $destFile);
        }
        return false;
    }

    public function copy($file, $destFile)
    {
        if (file_exists($file)) {
            return copy($file, $destFile);
        }
        return false;
    }

    public function handleTestChunk()
    {

        $identifier = $this->resumableParam($this->resumableOption['identifier']);
        $filename = $this->resumableParam($this->resumableOption['filename']);
        $chunkNumber = $this->resumableParam($this->resumableOption['chunkNumber']);


        if (!$this->isChunkUploaded($identifier, $filename, $chunkNumber)) {
            return $this->response->header(204);
        } else {
            return $this->response->header(200);
        }
    }

    /**
     * Get isUploadComplete
     *
     * @return boolean
     */
    public function isUploadComplete()
    {
        return $this->isUploadComplete;
    }

    /**
     * Get final filename.
     *
     * @return string Final filename
     */
    public function getFilename()
    {
        return $this->filename;
    }

    /**
     * Set final filename.
     *
     * @param string Final filename
     */
    public function setFilename($filename)
    {
        $this->filename = $filename;
        return $this;
    }

    /**
     * Get final filename.
     *
     * @return string Final filename
     */
    public function getOriginalFilename($withoutExtension = false)
    {
        if ($withoutExtension === static::WITHOUT_EXTENSION) {
            return $this->removeExtension($this->originalFilename);
        }
        return $this->originalFilename;
    }

    private function removeExtension($filename)
    {
        $parts = explode('.', basename($filename));
        $ext = end($parts); // get extension
        // remove extension from filename if any
        return str_replace(sprintf('.%s', $ext), '', $filename);
    }

    /**
     * Get final filapath.
     *
     * @return string Final filename
     */
    public function getFilepath()
    {
        return $this->filepath;
    }

    /**
     * Get final extension.
     *
     * @return string Final extension name
     */
    public function getExtension()
    {
        return $this->extension;
    }

    public function createObject($workspace_id, $filename, $extension, $user_id)
    {

        $identifier = $workspace_id . date("U") . bin2hex(random_bytes(20));

        $this->current_user_id = $user_id;

        $storage_provider = $this->storagemanager->getOneProvider();

        $chunklist = Array();
        $uploadstate = new UploadState($storage_provider, $workspace_id, $identifier, $filename, $extension, $chunklist);
        $new_key = bin2hex(random_bytes(20));
        $uploadstate->setEncryptionKey($new_key);
        $uploadstate->setEncryptionSalt("");
        $uploadstate->setEncryptionMode("OpenSSL-2");
        $uploadstate->setUserId($user_id);
        $this->doctrine->persist($uploadstate);
        $this->doctrine->flush();

        sleep(1);

        return $identifier;
    }

    /**
     * Makes sure the orginal extension never gets overriden by user defined filename.
     *
     * @param string User defined filename
     * @param string Original filename
     * @return string Filename that always has an extension from the original file
     */
//    private function createSafeFilename($filename, $originalFilename)
//    {
//        $filename = $this->removeExtension($filename);
//        $extension = $this->findExtension($originalFilename);
//        return sprintf('%s.%s', $filename, $extension);
//    }
    public function tmpChunkFilename($filename, $chunkNumber)
    {
        return $filename . '.' . str_pad($chunkNumber, 4, 0, STR_PAD_LEFT);
    }

    public function updateParam($request, $response)
    {
        $this->setRequest($request);
        $this->setResponse($response);
        $this->preProcess();
    }

    public function setRequest($request)
    {
        $this->request = $request;
    }

    public function setResponse($response)
    {
        $this->response = $response;
    }

    public function preProcess()
    {
        if (!empty($this->resumableParams())) {
            if (!empty($this->request->file())) {
                $this->extension = $this->findExtension($this->resumableParam('filename'));
                $this->originalFilename = $this->resumableParam('filename');
            }
        }
    }

    private function findExtension($filename)
    {
        $parts = explode('.', basename($filename));
        return end($parts);
    }


    public function getExclusiveFileHandle($name)
    {
        // if the file exists, fopen() will raise a warning
        $previous_error_level = error_reporting();
        error_reporting(E_ERROR);
        $handle = fopen($name, 'a');
        error_reporting($previous_error_level);
        return $handle;
    }

    public function removeFromStorage($data)
    {

        if ($data["upload_mode"] == "chunk") {

            $identifier = $data["identifier"];
            $chunkNumber = $data["nb_chunk"];

            $uploadstate = $this->doctrine->getRepository("Twake\Drive:UploadState")->findOneBy(Array("identifier" => $identifier));

            for ($i = 1; $i <= $chunkNumber; $i++) {
                $this->storagemanager->getAdapter($uploadstate->getStorageProvider())->remove($uploadstate, $i);
            }

            $this->doctrine->remove($uploadstate);
            $this->doctrine->flush();

            return true;

        }

        return false;
    }


}
