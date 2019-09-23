<?php
declare(strict_types=1);

namespace WebsiteApi\DriveUploadBundle\Services\ZipStream;

use RuntimeException;
use WebsiteApi\DriveUploadBundle\Services\Storage\AdapterInterface;

//class TwakeFileStream extends Stream
class TwakeFileStream implements StreamInterface
{

    private $manager;
    private $param_bag;
    private $uploadstate;

    private $totalchunk;
    private $current_chunk;
    private $stream;

    public function __construct($manager, $param_bag, $uploadstate)
    {
        $this->manager = $manager;
        $this->param_bag = $param_bag;
        $this->uploadstate = $uploadstate;
        $this->current_chunk = 1;
        $this->totalchunk = $this->uploadstate->getChunk();
        $this->stream = $this->manager->read("original_stream", $this->current_chunk, $this->param_bag, $this->uploadstate);

    }

    public function __destruct()
    {
        error_log("destruct");

        $this->close();
    }

    public function __toString(){
        error_log("tostring");
        try {
            $this->seek(0);
        } catch (\RuntimeException $e) {}
        return (string) stream_get_contents($this->stream);

    }

    public function close(){
        error_log("close");
        if (is_resource($this->stream)) {
            fclose($this->stream);
        }
        $this->detach();

    }

    public function detach(){
        error_log("deatach");
        $result = $this->stream;
        $this->stream = null;
        return $result;
    }

    public function getSize(){
        error_log("getsize");
        $stats = fstat($this->stream);
        return $stats['size'] + 1;
    }

    public function tell(){
        error_log("tell");

        $position = ftell($this->stream);
        if ($position === false) {
            throw new RuntimeException;
        }
        return $position;

    }

    public function isSeekable(){
        error_log("isseekable");
        return (bool)$this->getMetadata('seekable');

    }

    public function seek($offset, $whence = SEEK_SET){
        error_log("seek");
        if (!$this->isSeekable()) {
            throw new RuntimeException;
        }
        if (fseek($this->stream, $offset, $whence) !== 0) {
            throw new RuntimeException;
        }

    }

    public function rewind(){
        error_log("rewind");
        $this->seek(0);
        $this->current_chunk = 1;
        $this->manager->read("original_stream", $this->current_chunk, $this->param_bag, $this->uploadstate);

    }

    public function isWritable(){
        error_log("is writable");
        return false;
    }

    public function write($string){
        error_log("write");
        return false;
    }

    public function isReadable(){
        error_log("isreadable");
        return true;
    }

    public function getContents(){
        error_log("getContent");
        if (!$this->isReadable()) {
            throw new RuntimeException;
        }
        $result = stream_get_contents($this->stream);
        if ($result === false) {
            throw new RuntimeException;
        }
        return $result;
    }

    public function read($length){

        error_log(print_r("read : " . $length, true));
//            $this->current_chunk = 1;
//            $this->stream = $this->manager->read("original_stream", $this->current_chunk, $this->param_bag, $this->uploadstate);
        $retour = fread($this->stream, $length);
//            error_log(print_r($this->current_chunk,true));
        if ($retour === false) {
            throw new RuntimeException;
        }
        if($this->eof()){
            if($this->current_chunk < $this->totalchunk){
                error_log("CHANGEMENT CHUNK");
                fclose($this->stream);

                $this->current_chunk = $this->current_chunk +1;
                $this->stream = $this->manager->read("original_stream", $this->current_chunk, $this->param_bag, $this->uploadstate);

                if($length - strlen($retour) > 0) {
                    $retour = $retour . $this->read($length - strlen($retour));
                }
            }
        }
        return $retour;
    }


    public function eof(){
        error_log("eof");
////        if($this->current_chunk < $this->totalchunk){
////            return false;
////        }
////        elseif($this->current_chunk == $this->totalchunk){
//        if($this->current_chunk == $this->totalchunk){
//            //il faut regarder si il reste des données a dl
//            $pos = $this->tell();
//            $size = $this->size();
//            if($pos < $size){
//                return false;
//            }
//
//        }
//        return true;
        return feof($this->stream);
    }

    public function getMetadata($key = null){
        error_log("getmetadata");

        $metadata = stream_get_meta_data($this->stream);
        return $key !== null ? @$metadata[$key] : $metadata;
    }
}
