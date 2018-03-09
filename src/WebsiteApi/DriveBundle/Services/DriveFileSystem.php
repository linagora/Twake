<?php


namespace WebsiteApi\DriveBundle\Services;

use WebsiteApi\DriveBundle\Services\MCryptAES256Implementation;
use WebsiteApi\DriveBundle\Services\AESCryptFileLib;
use WebsiteApi\DriveBundle\Entity\DriveFile;
use WebsiteApi\DriveBundle\Entity\DriveFileLabel;
use WebsiteApi\DriveBundle\Entity\DriveFileVersion;
use WebsiteApi\DriveBundle\Model\DriveFileSystemInterface;

class DriveFileSystem implements DriveFileSystemInterface
{

	var $doctrine;
	var $root;

	public function __construct($doctrine, $rootDirectory){
		$this->doctrine = $doctrine;
		$this->root = $rootDirectory;
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

	public function getFreeSpace($group)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		// Get total size from root directory(ies) and file(s)
		$totalSize = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")->sumSize($group);

		return $this->getTotalSpace($group) - $totalSize;
	}

	public function getTotalSpace($group)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;
		if ($group == null) {
			return false;
		}
		return 50000000000;
		//TODO return $group->getDriveSize();
	}

	public function setTotalSpace($group, $space)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;
		if ($group == null) {
			return false;
		}
		return $group->setDriveSize($space);
	}

	public function canAccessTo($file, $group, $user = null)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;
		$file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");;
		if ($group == null) {
			return false;
		}
		if ($file == null) {
			return true;
		}
		return $file->getGroup() == $group;
	}


	private function getRoot()
	{
		return dirname($this->root) . "/" . "drive" . "/";
	}

	// @improveName updates name of object in case a directory already exists where we want to move it
	/**
	 * @param $fileOrDirectory
	 */
	private function improveName($fileOrDirectory)
	{
		$originalCompleteName = explode(".", $fileOrDirectory->getName());
		$originalName = array_shift($originalCompleteName);
		$originalExt = join(".", $originalCompleteName);

		$currentNames = [];
		if ($fileOrDirectory->getParent() != null) {
			foreach ($fileOrDirectory->getParent()->getChildren() as $brothers) {
				if ($brothers->getId() != $fileOrDirectory->getId()) {
					$currentNames[] = $brothers->getName();
				}
			}
		} else {
			foreach ($this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
				         ->listDirectory($fileOrDirectory->getGroup(), null, $fileOrDirectory->getIsInTrash()) as $brothers) {
				if ($brothers->getId() != $fileOrDirectory->getId()) {
					$currentNames[] = $brothers->getName();
				}
			}
		}

		$i = 2;

		//Verify there is not already a number
		$parts = explode(" ", $originalName);
		$last = array_pop($parts);
		if (intval($last) . "" == $last) {
			$i = intval($last) + 1;
			$originalName = join(" ", $parts);
		}

		while (in_array($fileOrDirectory->getName(), $currentNames)) {
			//Rename file
			$fileOrDirectory->setName($originalName . " " . $i . (($originalExt) ? "." : "") . $originalExt);
			$i++;
		}
	}

	private function updateSize($directory, $delta)
	{
		while ($directory != null) {
			$currentSize = $directory->getSize();
			$directory->setSize($currentSize + $delta);
			$this->doctrine->persist($directory);
			$directory = $directory->getParent();
		}
	}

	public function move($fileOrDirectory, $directory)
	{

		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
		$directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");;

		if ($fileOrDirectory == null) {
			return false;
		}

		if ($directory!=null && $fileOrDirectory->getId() == $directory->getId()) {
			return false;
		}

		//Update directories size
		$this->updateSize($fileOrDirectory->getParent(), -$fileOrDirectory->getSize());
		$this->updateSize($directory, $fileOrDirectory->getSize());

		$fileOrDirectory->setParent($directory);

		$this->improveName($fileOrDirectory);

		$this->doctrine->persist($fileOrDirectory);
		$this->doctrine->flush();

		return true;
	}

	private function recursCopy($inFile, $outFile)
	{
		if (!$inFile->getIsDirectory()) {

			//Copy real file
			$from = $this->getRoot() . $inFile->getPath();
			$to = $this->getRoot() . $outFile->getPath();

			if (file_exists($from)) {
				copy($from, $to);
			} else {
				$this->delete($inFile);
				return;
			}

		} else {

			foreach ($inFile->getChildren() as $child) {

				$newFile = new DriveFile(
					$child->getGroup(),
					$outFile,
					$child->getName(),
					$child->getIsDirectory()
				);

				$newFile->setSize($child->getSize());

				$this->doctrine->persist($newFile);

				$this->recursCopy($child, $newFile);

			}
		}
	}

	public function copy($fileOrDirectory, $newParent = null)
	{

		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;
		$newParent = $this->convertToEntity($newParent, "TwakeDriveBundle:DriveFile");;

		if ($fileOrDirectory == null || $this->getFreeSpace($fileOrDirectory->getGroup()) <= 0) {
			return false;
		}

		$parent = $fileOrDirectory->getParent();
		if ($newParent != null) {
			$parent = $newParent;
		}

		$newFile = new DriveFile(
			$fileOrDirectory->getGroup(),
			$parent,
			$fileOrDirectory->getName(),
			$fileOrDirectory->getIsDirectory()
		);

		$newFile->setSize($fileOrDirectory->getSize());

		$this->improveName($newFile);

		//If file copy version (same key currently -> to improve)
		if(!$newFile->getIsDirectory()) {

			$this->doctrine->persist($newFile);
			$this->doctrine->flush();

			$newVersion = new DriveFileVersion($newFile);
			$newFile->setLastVersion($newVersion);

			$newVersion->setKey($fileOrDirectory->getLastVersion()->getKey());
			$newVersion->setSize($fileOrDirectory->getSize());
			$this->doctrine->persist($newVersion);
		}

		// Copy real file and sub files (copy entities)
		$this->recursCopy($fileOrDirectory, $newFile);

		$this->updateSize($parent, $newFile->getSize());
		$this->improveName($fileOrDirectory);

		$this->doctrine->persist($newFile);
		$this->doctrine->flush();

		return true;

	}

	public function rename($fileOrDirectory, $filename, $description=null, $labels=Array())
	{

		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

		if ($fileOrDirectory == null) {
			return false;
		}

		//Update labels
		$labelsRepository = $this->doctrine->getRepository("TwakeDriveBundle:DriveLabel");
		$old_labels = $this->doctrine->getRepository("TwakeDriveBundle:DriveFileLabel")->findBy(Array("file"=>$fileOrDirectory));

		foreach ($old_labels as $old_label){
			$found = false;
			foreach ($labels as $new_label) {
				if ($old_label->getId() == $new_label["id"]) {
					$found = true;
					break;
				}
			}
			if(!$found) {
				$this->doctrine->remove($old_label);
			}
		}

		foreach ($labels as $new_label){
			$found = false;
			foreach ($old_labels as $old_label) {
				if ($old_label->getId() == $new_label["id"]) {
					$found = true;
					break;
				}
			}
			if(!$found) {
				$l = $labelsRepository->find($new_label["id"]);
				if($l) {
					$new_label = new DriveFileLabel($fileOrDirectory, $l);
					$this->doctrine->persist($new_label);
				}
			}
		}

		//End update label

		$fileOrDirectory->setName($filename);
		$fileOrDirectory->setDescription($description);
		$fileOrDirectory->setCache("labels", $labels);
		$this->improveName($fileOrDirectory);
		$this->doctrine->persist($fileOrDirectory);

		//Flush
		$this->doctrine->flush();

		return true;

	}

	public function create($group, $directory, $filename, $content = "", $isDirectory = false)
	{

		if ($directory == 0) {
			$directory = null;
		}

		$directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");;
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null || $this->getFreeSpace($group) <= 0) {
			return false;
		}

		$newFile = new DriveFile(
			$group,
			$directory,
			$filename,
			$isDirectory
		);

		$newFile->setLastModified();

		if (!$isDirectory) {

			$this->doctrine->persist($newFile);
			$this->doctrine->flush();

			$fileVersion = new DriveFileVersion($newFile);
			$newFile->setLastVersion($fileVersion);

			$path = $this->getRoot() . $newFile->getPath();
			$this->verifyPath($path);
			$this->writeEncode($path, $fileVersion->getKey(), $content, $fileVersion->getMode());
			$size = filesize($path);

			$fileVersion->setSize($size);
			$this->doctrine->persist($fileVersion);

		} else {
			$size = 10;
		}

		$newFile->setSize($size);

		$this->updateSize($directory, $size);
		$this->improveName($newFile);

		$this->doctrine->persist($newFile);
		$this->doctrine->flush();

		return $newFile;
	}

	public function getRawContent($file)
	{
		$file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");;

		if ($file == null) {
			return false;
		}

		if ($file->getSize() > 5000000) { //5Mo (protection)
			return "";
		}

		$path = $this->getRoot() . $file->getPath();
		$this->verifyPath($path);

		if (!file_exists($path)) {
			return null;
		}

		return $this->readDecode($path, $file->getLastVersion()->getKey(), $file->getLastVersion()->getMode());
	}

	public function setRawContent($file, $content = null, $newVersion = false)
	{
		/**
		 * @var DriveFile
		 */
		$file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");;

		if ($file == null) {
			return false;
		}

		$path = $this->getRoot() . $file->getPath();

		if (file_exists($path)) {

			if($newVersion){
				$newVersion = new DriveFileVersion($file);
				$file->setLastVersion($newVersion);
				$this->doctrine->persist($newVersion);
			}

			if ($content != null) {
				$this->verifyPath($path);
				$this->writeEncode($path, $file->getLastVersion()->getKey(), $content, $file->getLastVersion()->getMode());
			}

			$file->setSize(filesize($path));
			$file->setLastModified();
			$this->updateSize($file->getParent(), $file->getSize());

		} else {
			$this->delete($file);
		}

		$this->doctrine->persist($file);
		$this->doctrine->flush();

		return true;
	}

	public function getInfos($fileOrDirectory)
	{
		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

		if ($fileOrDirectory == null) {
			return false;
		}

		$data = $fileOrDirectory->getAsArray();

		return $data;
	}

	public function listDirectory($group, $directory, $trash=false)
	{

		$directory = $this->convertToEntity($directory, "TwakeDriveBundle:DriveFile");;
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		$list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
			->listDirectory($group, $directory, $trash);
		return $list;
	}

	public function search($group, $query, $offset = 0, $max = 20)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		$sort = Array();

		$list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
			->search($group, $query, $sort, $offset, $max);
		return $list;
	}

	public function listNew($group, $offset = 0, $max = 20)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		$list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
			->search($group, Array(), Array("added"=>"DESC"), $offset, $max);
		return $list;
	}

	public function listShared($group, $offset = 0, $max = 20)
	{
		//TODO
		return Array();
	}

	public function listTrash($group)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		$list = $this->doctrine->getRepository("TwakeDriveBundle:DriveFile")
			->listDirectory($group, null, true);
		return $list;
	}

	public function autoDelete($fileOrDirectory)
	{
		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

		if ($fileOrDirectory == null) {
			return false;
		}

		// If already in trash force remove
		if ($fileOrDirectory->getIsInTrash()) {
			return $this->delete($fileOrDirectory);
		}

		$fileOrDirectory->setOldParent($fileOrDirectory->getParent());
		$fileOrDirectory->setParent(null); //On le met dans le root de la corbeille
		$fileOrDirectory->setIsInTrash(true);

		$this->updateSize($fileOrDirectory->getOldParent(), -$fileOrDirectory->getSize());

		$this->doctrine->persist($fileOrDirectory);
		$this->doctrine->flush();

		return true;
	}

	private function recursDelete($fileOrDirectory)
	{
		if ($fileOrDirectory == null) {
			return false;
		}

		$this->updateSize($fileOrDirectory->getParent(), -$fileOrDirectory->getSize());

		if (!$fileOrDirectory->getIsDirectory()) {

			// Remove real file
			$real = $this->getRoot() . $fileOrDirectory->getPath();
			if (file_exists($real)) {
				unlink($real);
			}

		} else {

			foreach ($fileOrDirectory->getChildren() as $child) {

				$this->recursDelete($child);

			}
		}

		$this->doctrine->remove($fileOrDirectory);

		return true;
	}

	public function delete($fileOrDirectory)
	{
		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");

		if ($fileOrDirectory == null) {
			return false;
		}

		$this->recursDelete($fileOrDirectory);

		$this->doctrine->flush();

		return true;
	}

	public function restore($fileOrDirectory)
	{
		$fileOrDirectory = $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");;

		if ($fileOrDirectory == null) {
			return false;
		}

		$fileOrDirectory->setParent($fileOrDirectory->getOldParent()); //On le met dans le root de la corbeille
		$fileOrDirectory->setIsInTrash(false);

		$this->updateSize($fileOrDirectory->getParent(), $fileOrDirectory->getSize());

		$this->doctrine->persist($fileOrDirectory);
		$this->doctrine->flush();

		return true;
	}

	public function emptyTrash($group)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		if ($this->listTrash($group) == false) {
			return false;
		}

		$list = $this->listTrash($group);

		foreach ($list as $child) {
			$this->delete($child);
		}

		return true;
	}

	public function restoreTrash($group)
	{
		$group = $this->convertToEntity($group, "TwakeWorkspacesBundle:Workspace");;

		if ($group == null) {
			return false;
		}

		if ($this->listTrash($group) == false) {
			return false;
		}

		$list = $this->listTrash($group);

		foreach ($list as $child) {
			$this->restore($child);
		}

		return true;
	}

	public function getObject($fileOrDirectory)
	{
		return $this->convertToEntity($fileOrDirectory, "TwakeDriveBundle:DriveFile");
	}

	public function upload($group, $directory, $file, $uploader)
	{

		$newFile = $this->create($group, $directory, $file["name"], "", false);
		if (!$file) {
			return false;
		}

		$real = $this->getRoot() . $newFile->getPath();
		$context = Array(
			"max_size" => 100000000 // 100Mo
		);
		$errors = $uploader->upload($file, $real, $context);

		$this->encode($this->getRoot() . $newFile->getPath(), $newFile->getLastVersion()->getKey(), $newFile->getLastVersion()->getMode());

		$this->setRawContent($newFile);

		if (count($errors["errors"]) > 0) {
			$this->delete($newFile);
			return false;
		}

		return $newFile;

	}

	public function download($group, $file, $download)
	{

		$group = $this->convertToEntity($group, "TwakeDriveBundle:DriveFile");
		$file = $this->convertToEntity($file, "TwakeDriveBundle:DriveFile");

		//Directory : download as zip
		if ($file->getIsDirectory() || $file == null) { //Directory or root

			//TODO zip download

		} else {

			$completePath = $this->getRoot() . $file->getPath();

			ini_set('memory_limit', '10M');

			$completePath = $this->decode($completePath, $file->getLastVersion()->getKey(), $file->getLastVersion()->getMode());

			error_log("hey !");

			$ext = $this->getInfos($file)['extension'];

			header('Content-Description: File Transfer');


			if ($download) {
				header('Content-Type: application/octet-stream');
				header("Content-type: application/force-download");
				header('Content-Disposition: attachment; filename="' . $file->getName() . '"');
			} else {

				header('Content-Disposition: inline; filename="' . $file->getName() . '"');

				if (in_array($ext, ["gif", "svg", "jpeg", "jpg", "tiff", "png"])) {
					header('Content-Type: image; filename="' . $file->getName() . '"');
				}
				if ($ext == "pdf") {
					header("Content-type: application/pdf");
				}
			}

			header('Expires: 0');
			header('Cache-Control: must-revalidate');
			header('Pragma: public');
			header('Content-Length: ' . filesize($completePath));

			$fp = fopen($completePath, "r");

			ob_clean();
			flush();
			while (!feof($fp)) {
				$buff = fread($fp, 1024);
				print $buff;
			}

			//Delete decoded file
			@unlink($completePath);

			exit;
			die();
		}

	}

	private function verifyPath($path)
	{
		$path = dirname($path);
		if (!file_exists($path)) {
			mkdir($path, 0777, true);
		}
	}

	private function encode($path, $key, $mode="AES"){

		if($mode=="AES") {
			$mcrypt = new MCryptAES256Implementation();
			$lib = new AESCryptFileLib($mcrypt);
		}
		if($mode=="OpenSSL") {
			$lib = new OpenSSLCryptLib();
		}

		$pathTemp = $path . ".tmp";
		rename($path, $pathTemp);

		error_log($key);

		$lib->encryptFile($pathTemp, $key, $path);

		@unlink($pathTemp);

	}

	private function decode($path, $key, $mode="AES"){

		if($mode=="AES") {
			$mcrypt = new MCryptAES256Implementation();
			$lib = new AESCryptFileLib($mcrypt);
		}
		if($mode=="OpenSSL") {
			$lib = new OpenSSLCryptLib();
		}

		$tmpPath = $this->getRoot() . "/tmp/" . bin2hex(random_bytes(16));
		$this->verifyPath($tmpPath);

		$lib->decryptFile($path, $key, $tmpPath);

		return $tmpPath;

	}

	private function writeEncode($path, $key, $content, $mode="AES"){
		file_put_contents($path, $content);
		if($content!="") {
			$this->encode($path, $key, $mode);
		}
	}

	private function readDecode($path, $key, $mode="AES"){
		$path = $this->decode($path, $key, $mode);
		$var = file_get_contents($path);
		@unlink($path);
		return $var;
	}
}
