<?php

namespace WebsiteApi\DriveUploadBundle\Services\Resumable;

use Cake\Filesystem\File;
use Cake\Filesystem\Folder;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleRequest;
use WebsiteApi\DriveUploadBundle\Services\Resumable\Network\SimpleResponse;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;


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
        'totalSize' => 'totalSize'
    ];
    protected  $parameter_drive_salt = "let's try a salt";
    protected $date;

    const WITHOUT_EXTENSION = true;

    public function __construct(SimpleRequest $request, SimpleResponse $response)
    {
        $this->request = $request;
        $this->response = $response;
        $this->log = new Logger('debug');
        $this->log->pushHandler(new StreamHandler('debug.log', Logger::DEBUG));
        $this->preProcess();
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
    public function process()
    {
        if (!empty($this->resumableParams())) {
            if (!empty($this->request->file())) {
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
    /**
     * Makes sure the orginal extension never gets overriden by user defined filename.
     *
     * @param string User defined filename
     * @param string Original filename
     * @return string Filename that always has an extension from the original file
     */
    private function createSafeFilename($filename, $originalFilename)
    {
        $filename = $this->removeExtension($filename);
        $extension = $this->findExtension($originalFilename);
        return sprintf('%s.%s', $filename, $extension);
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
        $chunkSize = $this->resumableParam($this->resumableOption['chunkSize']);
        $totalSize = $this->resumableParam($this->resumableOption['totalSize']);

        $finalname = $identifier.".chunk_".$chunkNumber;

        if (!$this->isChunkUploaded($identifier, $finalname, $chunkNumber)) {
            $chunkFile = $this->tmpChunkDir($identifier) . DIRECTORY_SEPARATOR . $finalname;
            $this->moveUploadedFile($file['tmp_name'], $chunkFile);
            return $chunkFile;

        }
//        if ($this->isFileUploadComplete($finalname, $identifier, $chunkSize, $totalSize)) {
//            $this->isUploadComplete = true;
//            $this->createFileAndDeleteTmp($identifier, $finalname);
//        }
        return $this->response->header(200);
    }

    public function isChunkUploaded($identifier, $filename, $chunkNumber)
    {
        $file = new File($this->tmpChunkDir($identifier) . DIRECTORY_SEPARATOR . $filename);
        return $file->exists();
    }


    public function moveUploadedFile($file, $destFile)
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

    /**
     * Create the final file from chunks
     */
    private function createFileAndDeleteTmp($identifier, $filename)
    {

        $tmpFolder = new Folder($this->tmpChunkDir($identifier));
        $chunkFiles = $tmpFolder->read(true, true, true)[1];
        // if the user has set a custom filename
        if (null !== $this->filename) {
            $finalFilename = $this->createSafeFilename($this->filename, $filename);
        } else {
            $finalFilename = $filename;
        }
        // replace filename reference by the final file
        $this->filepath = $this->uploadFolder . DIRECTORY_SEPARATOR . $finalFilename;
        $this->extension = $this->findExtension($this->filepath);
        if ($this->createFileFromChunks($chunkFiles, $this->filepath) && $this->deleteTmpFolder) {
            $tmpFolder->delete();
            $this->uploadComplete = true;
        }
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
    public function isFileUploadComplete($filename, $identifier, $chunkSize, $totalSize)
    {
        if ($chunkSize <= 0) {
            return false;
        }
        $numOfChunks = intval($totalSize / $chunkSize) + ($totalSize % $chunkSize == 0 ? 0 : 1);
        for ($i = 1; $i < $numOfChunks; $i++) {
            if (!$this->isChunkUploaded($identifier, $filename, $i)) {
                return false;
            }
        }
        return true;
    }

    public function tmpChunkDir($identifier)
    {
        //$tmpChunkDir = $this->tempFolder . DIRECTORY_SEPARATOR . $identifier;
        $tmpChunkDir = $this->tempFolder;
        if (!file_exists($tmpChunkDir)) {
            mkdir($tmpChunkDir);
        }
        return $tmpChunkDir;
    }

    public function getExclusiveFileHandle($name)
    {
        // if the file exists, fopen() will raise a warning
        $previous_error_level = error_reporting();
        error_reporting(E_ERROR);
        $handle = fopen($name, 'x');
        error_reporting($previous_error_level);
        return $handle;
    }
    public function createFileFromChunks($chunkFiles, $destFile)
    {
        $this->log('Beginning of create files from chunks');
        natsort($chunkFiles);
        $handle = $this->getExclusiveFileHandle($destFile);
        if (!$handle) {
            return false;
        }
//        $destFile = new File($destFile);
//        $destFile->handle = $handle;
        foreach ($chunkFiles as $chunkFile) {
            $file = new File($chunkFile);
//            $destFile->append($file->read());
//            $this->log('Append ', ['chunk file' => $chunkFile]);
        }
        $this->log('End of create files from chunks');
        return $destFile->exists();
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