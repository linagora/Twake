<?php

namespace Twake\Drive\Command;

use Common\Commands\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Twake\Drive\Services\DriveFileSystemOld;


class DrivePreviewCommand extends ContainerAwareCommand
{
    var $leveladmin;
    var $output;
    var $force;
    var $twake;

    protected function configure()
    {
        $this
            ->setName("twake:preview_worker");
    }

    protected function execute()
    {
        $services = $this->getApp()->getServices();

        $this->queues = $services->get("app.queues")->getAdapter();
        $this->em = $services->get("app.twake_doctrine");
        $this->pusher = $services->get("app.pusher");
        $this->preview = $services->get("app.drive.preview");
        $this->root = $this->getApp()->getContainer()->getParameter('kernel.root_dir');
        $this->drive_previews_tmp_folder = $this->getApp()->getContainer()->getParameter("drive_previews_tmp_folder");
        $this->storagemanager = $services->get("driveupload.storemanager");

        $limit = date("U", date("U") + 60);

        while (date("U") < $limit) {

            $todos = $this->queues->consume("drive_preview_to_generate", true);
            if (count($todos ?: []) == 0) {
                sleep(1);
            }
            foreach ($todos ?: [] as $todo_original) {
                $todo = $this->queues->getMessage($todo_original);
                $this->autoGenPreview($todo["file_id"]);
                $this->queues->ack("drive_preview_to_generate", $todo_original);
            }

        }

    }

    public function autoGenPreview($file_id)
    {
        /* @var DriveFile $file */
        $file = $this->em->getRepository("Twake\Drive:DriveFile")->findOneBy(Array("id" => $file_id));
        if ($file->getSize() > 10 && $file->getSize() < 50000000) {

            $file->setPreviewHasBeenGenerated(true);

            if (in_array(strtolower($file->getExtension()), $this->preview->previewableExt)) {

                $tmppath = $this->checkLocalFileForPreview($file);

                if (!$tmppath || !file_exists($tmppath)) {
                    //TODO Unimplemented $tmppath = $this->oldFileSystem->decode($path, $file->getLastVersion($this->doctrine)->getKey(), $file->getLastVersion($this->doctrine)->getMode());
                }

                $res = $this->storagemanager->getAdapter()->genPreview($file, $tmppath);
                if ($res) {
                    $file->setHasPreview(true);
                }

            }

            $this->em->persist($file);
            $this->em->flush();

            $this->pusher->push(Array("action" => "update_file", "file" => $file->getAsArray()), "drive/file/" . $file->getWorkspaceId() . "/" . $file->getParentId());

        }


        return true;
    }

    public function checkLocalFileForPreview($file)
    {
        $tmppath = null;
        $version = $this->em->getRepository("Twake\Drive:DriveFileVersion")->findOneBy(Array("id" => $file->getLastVersionId()));
        if ($version && isset($version->getData()["identifier"]) && isset($version->getData()["upload_mode"]) && $version->getData()["upload_mode"] == "chunk") {
            $uploadstate = $this->em->getRepository("Twake\Drive:UploadState")->findOneBy(Array("identifier" => $version->getData()["identifier"]));
            if ($uploadstate && $uploadstate->getHasPreview()) {
                $tmppath = $this->drive_previews_tmp_folder . "/preview_" . $uploadstate->getIdentifier() . ".chunk_1";
            }
        }
        return $tmppath;
    }

}
