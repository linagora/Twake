<?php

namespace WebsiteApi\DriveUploadBundle\Services\Resumable;

use Cake\Filesystem\File;
use Cake\Filesystem\Folder;
use WebsiteApi\DriveUploadBundle\Entity\UploadState;

use WebsiteApi\DriveBundle\Services\DriveFileRefacto;


use Monolog\Logger;
use Monolog\Handler\StreamHandler;

use WebsiteApi\DriveUploadBundle\Services\Storage\EncryptionBag;

class Resumable
{
    public $debug = false;
    public $tempFolder = 'tmp';
    public $uploadFolder = 'test/files/uploads';
    // for testing
    public $deleteTmpFolder = true;
    protected $request;
    protected $response;
    protected $params;
    protected $chunkFile;
    protected $log;
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
    protected $file_system;

    const WITHOUT_EXTENSION = true;

    public function __construct($doctrine, $storagemanager, $driverefacto, $drive_previews_tmp_folder, $drive_tmp_folder, $file_system)
    {
        $this->doctrine = $doctrine;
        $this->storagemanager = $storagemanager;
        $this->driverefacto = $driverefacto;
        $this->log = new Logger('debug');
        $this->log->pushHandler(new StreamHandler('debug.log', Logger::DEBUG));
        $this->previews = $drive_previews_tmp_folder;
        $this->tempFolder = $drive_tmp_folder;
        $this->file_system = $file_system;


        //$this->preProcess();
    }
    public function setResumableOption(array $resumableOption)
    {
        $this->resumableOption = array_merge($this->resumableOption, $resumableOption);
    }
    // sets original filename and extenstion, blah blah
    public function preProcess()
    {
        if (!empty($this->resumableParams())) {
            if (!empty($this->request->file())) {
                $this->extension = $this->findExtension($this->resumableParam('filename'));
                $this->originalFilename = $this->resumableParam('filename');
            }
        }
    }

    public function process($current_user)
    {
        if (!empty($this->resumableParams())) {
            if (!empty($this->request->file())) {
                $this->current_user = $current_user;
                return $this->handleChunk();
            } else {
                $this->handleTestChunk();
            }
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
    public function getFilename()
    {
        return $this->filename;
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

    public function createObject($workspace_id, $identifier, $filename, $extension)
    {

        $chunklist = Array();
        $uploadstate = new UploadState($workspace_id, $identifier, $filename, $extension, $chunklist);
        $new_key = hash('sha256', $identifier);
        $uploadstate->setEncryptionKey($new_key);
        $this->doctrine->persist($uploadstate);
        $this->doctrine->flush();
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

    public function handleChunk()
    {
        //  VERIFIER IDENTIFIER QU ON A BIEN QUE DES CHIFFRES ET DES LETTRES ET PAS UN REQUETE OU AUTRES.
        $file = $this->request->file();
        $identifier = $this->resumableParam($this->resumableOption['identifier']);
        $filename = $this->resumableParam($this->resumableOption['filename']);
        $chunkNumber = $this->resumableParam($this->resumableOption['chunkNumber']);
        $totalSize = intval($_POST["resumableTotalSize"]);
        $numOfChunks = intval($_POST["resumableTotalChunks"]);


        $finalname = $identifier.".chunk_".$chunkNumber;

        if (!$this->isChunkUploaded($identifier, $finalname, $chunkNumber)) {

            $chunkFile = $this->tmpChunkDir() . DIRECTORY_SEPARATOR . $finalname;
            $this->moveUploadedFile($file['tmp_name'], $chunkFile);
            //error_log(print_r($this->tmpChunkDir($identifier),true));
            //error_log(print_r(posix_getcwd() ,true));
            $chunktoadd = "chunk_" . $chunkNumber;

            $uploadstate = $this->doctrine->getRepository("TwakeDriveUploadBundle:UploadState")->findOneBy(Array("identifier" => $identifier));
            $key = $uploadstate->getEncryptionKey();
            //error_log(print_r($key,true));


            //Preview if only one chunk
            if ($numOfChunks == 1 && $chunkNumber == 1) {
                $previewDestination = $this->previews . DIRECTORY_SEPARATOR . "preview_" . $finalname;
                $this->copy($chunkFile, $previewDestination);
                $uploadstate->setHasPreview(true);
                $this->doctrine->persist($uploadstate);
                $this->doctrine->flush();
            }


            $param_bag = new EncryptionBag($key, $this->parameter_drive_salt, "OpenSSL-2");
            $this->storagemanager->getAdapter()->write($chunkFile, $chunkNumber, $param_bag, $uploadstate);
            $this->doctrine->clear();

            $uploadstate = $this->doctrine->getRepository("TwakeDriveUploadBundle:UploadState")->findOneBy(Array("identifier" => $identifier));
            $uploadstate->addChunk($chunktoadd);
            $this->doctrine->persist($uploadstate);
            $this->doctrine->flush();

        }

        if ( isset($uploadstate) && $uploadstate->getChunk() == $numOfChunks && count($uploadstate->getChunklist()) == $numOfChunks ) {

            $this->isUploadComplete = true;
            $uploadstate->setSuccess(true);
            $uploadstate->setChunk($chunkNumber);
            $this->doctrine->persist($uploadstate);
            $this->doctrine->flush();

            $object = json_decode($_POST['object'], 1);

            //error_log(print_r($this->current_user,true));


            //recupere les données dans la requete pour connaitre l'id, le parent, le workspace etc

            $parent_id = $object['parent_id'];
            $is_directory = $object['is_directory'];
            $name = $object['name'];
            $detached = $object['detached'];
            $workspace_id = $object['workspace_id'];
            $front_id = $object['front_id'];

            $object = Array(
                "parent_id" => $parent_id,
                "is_directory" => $is_directory,
                "detached" => $detached,
                "workspace_id" => $workspace_id,
                "front_id" => $front_id,
                "name" => $name
            );

            $data = Array("upload_mode" => "chunk", "identifier" => $identifier, "nb_chunk" => $chunkNumber);

            $fileordirectory = $this->driverefacto->save($object, $options, $current_user, Array("data" => $data, "size" => $totalSize), true);

            if ($uploadstate->getHasPreview()) {
                $this->file_system->getFileSystem()->genPreview($fileordirectory);
            }

            return $fileordirectory->getAsArray();

        }
        return $chunkFile;
    }

    public function isChunkUploaded($identifier, $filename, $chunkNumber)
    {
        $part = explode("_",$filename)[0];
        $chemin = $this->tmpChunkDir($identifier) . DIRECTORY_SEPARATOR . $part . "_" . $chunkNumber;
        //error_log("chemin");
        //error_log(print_r($chemin,true));

        $file = new File($chemin);

        //$file = new File($this->tmpChunkDir($identifier) . DIRECTORY_SEPARATOR . $filename);
//        error_log("passage");
//        if($file->exists() == 1)
//            return true;
//        else
//            return false;
        return $file->exists();
    }

//    public function isFileUploadComplete($filename, $identifier, $chunkSize, $totalSize)
//    {
//        //error_log("cc");
//        if ($chunkSize <= 0) {
//            return false;
//        }
//        $numOfChunks = intval($totalSize / $chunkSize) + ($totalSize % $chunkSize == 0 ? 0 : 1);
//        //$numOfChunks= intval($totalSize / $chunkSize) ;
//        for ($i = 1; $i < $numOfChunks; $i++) {
//            if (!$this->isChunkUploaded($identifier, $filename, $i)) {
//                return false;
//            }
//        }
//
//        return true;
//    }


    public function moveUploadedFile($file, $destFile)
    {
        $file = new File($file);
        if ($file->exists()) {
            return $file->copy($destFile);
        }
        return false;
    }

    public function copy($file, $destFile)
    {
        $file = new File($file);
        if ($file->exists()) {
            return $file->copy($destFile);
        }
        return false;
    }

    public function tmpChunkFilename($filename, $chunkNumber)
    {
        return $filename . '.' . str_pad($chunkNumber, 4, 0, STR_PAD_LEFT);
    }

    public function updateParam($request, $response, $parameter_drive_salt)
    {
        $this->parameter_drive_salt = $parameter_drive_salt;
        $this->setRequest($request);
        $this->setResponse($response);
        $this->preProcess();
    }

    public function downloadFile()
    {

        $uploadstate = $this->doctrine->getRepository("TwakeDriveUploadBundle:UploadState")->findBy(Array());
        //var_dump(count($uploadstate));
        //var_dump($uploadstate);
        foreach ($uploadstate as $upload){
            $this->doctrine->remove($upload);
        }
        $this->doctrine->flush();

        $uploadstate = $this->doctrine->getRepository("TwakeDriveUploadBundle:UploadState")->findOneBy(Array("filename" => "fichier1go.txt"));
        $param_bag = new EncryptionBag("testkey","let's try a salt", "OpenSSL-2");
        $path = $this->createFileAndDeleteTmp("uploads", "fichier1go.txt");

        for ($i = 1; $i <= $uploadstate->getChunk(); $i++) {
            $chunkFile = $uploadstate->getIdentifier() . ".chunk_" . $i;
            $this->storagemanager->getAdapter()->read($chunkFile, $i, $param_bag, $uploadstate);
            $chunkFile = "uploads" . DIRECTORY_SEPARATOR . $chunkFile . ".decrypt";
            $this->createFileFromChunks($chunkFile,$path);
        }
    }

    public function createFileFromChunks($chunkFile, $destFile)
    {
        $this->log('Beginning of create files from chunks');
        //natsort($chunkFiles);
        //error_log(print_r($chunkFile,true));
        $handle = $this->getExclusiveFileHandle($destFile);
        //error_log(print_r($handle,true));
        if (!$handle) {
            return false;
        }
        $destFile = new File($destFile);
        $destFile->handle = $handle;

        $file = new File($chunkFile);
        //var_dump($destFile->read());
        $destFile->append($file->read());
        @unlink($chunkFile);
        $this->log('Append ', ['chunk file' => $chunkFile]);

        $this->log('End of create files from chunks');
        return $destFile->exists();
    }

    /**
     * Create the final file from chunks
     */
    private function createFileAndDeleteTmp($folder, $filename)
    {
        //$tmpFolder = new Folder($this->tmpChunkDir($identifier));
        //$chunkFiles = $tmpFolder->read(true, true, true)[1];
        // if the user has set a custom filename
        if (null !== $this->filename) {
            $finalFilename = $this->createSafeFilename($this->filename, $filename);
        } else {
            $finalFilename = $filename;
        }
        // replace filename reference by the final file
        return $this->filepath = $folder . DIRECTORY_SEPARATOR . $finalFilename;

//        $this->extension = $this->findExtension($this->filepath);
//        if ($this->createFileFromChunks($chunkFiles, $this->filepath) && $this->deleteTmpFolder) {
//            $tmpFolder->delete();
//            $this->uploadComplete = true;
//        }
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

    public function getExclusiveFileHandle($name)
    {
        // if the file exists, fopen() will raise a warning
        $previous_error_level = error_reporting();
        error_reporting(E_ERROR);
        $handle = fopen($name, 'a');
        error_reporting($previous_error_level);
        return $handle;
    }

    private function resumableParam($shortName)
    {
        $resumableParams = $this->resumableParams();
        if (!isset($resumableParams['resumable' . ucfirst($shortName)])) {
            return null;
        }
        return $resumableParams['resumable' . ucfirst($shortName)];
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

    public function tmpChunkDir()
    {
        //$tmpChunkDir = $this->tempFolder . DIRECTORY_SEPARATOR . $identifier;
        $tmpChunkDir = $this->tempFolder;
        error_log($tmpChunkDir);
        if (!file_exists($tmpChunkDir)) {
            mkdir($tmpChunkDir);
        }
        return $tmpChunkDir;
    }

    public function setRequest($request)
    {
        $this->request = $request;
    }
    public function setResponse($response)
    {
        $this->response = $response;
    }

    private function log($msg, $ctx = array())
    {
        if ($this->debug) {
            $this->log->addDebug($msg, $ctx);
        }
    }
    private function findExtension($filename)
    {
        $parts = explode('.', basename($filename));
        return end($parts);
    }
    private function removeExtension($filename)
    {
        $parts = explode('.', basename($filename));
        $ext = end($parts); // get extension
        // remove extension from filename if any
        return str_replace(sprintf('.%s', $ext), '', $filename);
    }

}
