<?php

namespace Twake\Drive\Command;

use Symfony\Bundle\Framework\Command\ContainerAwareCommand;
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

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $services = $this->getApplication()->getKernel()->getContainer();

        $this->em = $services->get("app.twake_doctrine");
        $this->pusher = $services->get("app.pusher");
        $this->preview = $services->get("app.drive.preview");
        $this->root = $this->getContainer()->getParameter('kernel.root_dir');
        $this->drive_previews_tmp_folder = $this->getContainer()->getParameter("drive_previews_tmp_folder");
        $this->storagemanager = $services->get("driveupload.storemanager");

        $this->autoGenPreview($services);
    }

    public function autoGenPreview()
    {
        $start = microtime(true);
        $time_elapsed_secs = 0;

        while ($time_elapsed_secs < 60) {
            /* @var DriveFile $file */
            $files = $this->em->getRepository("Twake\Drive:DriveFile")->findBy(Array("previewhasbeengenerated" => false), Array(), 50);
            foreach ($files as $file) {
                if ($file->getSize() > 10 && $file->getSize() < 50000000) {

                    $file->setPreviewHasBeenGenerated(true);

                    if (in_array(strtolower($file->getExtension()), $this->previewableExt)) {

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

            }
            $this->em->clear();
            sleep(1);

            $time_elapsed_secs = microtime(true) - $start;
        }
        return true;
    }

    public function checkLocalFileForPreview(DriveFile $file)
    {
        $tmppath = null;
        $version = $this->doctrine->getRepository("Twake\Drive:DriveFileVersion")->findOneBy(Array("id" => $file->getLastVersionId()));
        if (isset($version->getData()["identifier"]) && isset($version->getData()["upload_mode"]) && $version->getData()["upload_mode"] == "chunk") {
            $uploadstate = $this->doctrine->getRepository("Twake\Drive:UploadState")->findOneBy(Array("identifier" => $version->getData()["identifier"]));
            if ($uploadstate && $uploadstate->getHasPreview()) {
                $tmppath = $this->drive_previews_tmp_folder . "/preview_" . $uploadstate->getIdentifier() . ".chunk_1";
            }
        }
        return $tmppath;
    }

}