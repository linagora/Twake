<?php

namespace WebsiteApi\DriveBundle\Model;

//TODO : - replace current arguments by service arguments (no $request)
//       - reduce the number of function if possible
//       - add comments

/**
 * This is an interface for the service DriveFileSystem
 *
 * This service is responsible of all s regarding the Drive it should be used everytime
 */
interface DriveFileSystemInterface
{

	// @getFreeSpace returns remaining space of a group Drive
	public function getFreeSpace($group); // $group : entity or id

	// @getTotalSpace returns total space of a group Drive
	public function getTotalSpace($group); // $group : entity or id

	// @setTotalSpace set a new value for total allowed space
	public function setTotalSpace($group, $space); // $group : entity or id, $space in B

	// @canAccessTo return a boolean
	public function canAccessTo($file, $group, $user);

	// @move moves a file to another directory
	public function move($fileOrDirectory, $directory); // $file : entity or id, $directory : entity or id

	// @copy copy a file to another directory
	public function copy($fileOrDirectory, $newParent = null); // $fileOrDirectory : entity or id

	// @rename renames a file
	public function rename($fileOrDirectory, $filename, $description=null, $labels=Array()); // $file : entity or id, $filename : string

	// @create creates a file in a directory with optional content
	public function create($group, $directory, $filename, $content = "", $isDirectory = false, $detached=false); // $file : entity or id

	// @getRawContent returns content of a file (if less than 5mo)
	public function getRawContent($file); // $file : entity or id

	// @setRawContent set content of a file
	public function setRawContent($file, $content = ""); // $file : entity or id

	// @getInfos returns informations of the file :
	// - name
	// - extension
	// - mimetype (generated from content & extension, should be more accurate than extension)
	// - size
	// - parent directory id
	// - object id
	// - group id
	public function getInfos($fileOrDirectory); // $fileOrDirectory : entity or id

	// @listDirectory returns objects in directory
	public function listDirectory($group, $directory, $inTrash=false); // $directory : entity or id

	// @listNew returns new objects
	public function listNew($group, $offset = 0, $max = 20);

	// @listShared returns shared objects
	public function listShared($group);

	// @search searches files with such name (given in query)
	// Query
	// - name
	// - extension
	// - parent directory
	// - min size
	// - max size
	public function search($group, $query, $offset = 0, $max = 20);

	// @toTrash set a file into trash
	public function autoDelete($fileOrDirectory);

	// @delete delete a file definitively
	public function delete($fileOrDirectory);

	// @restore restores a file present in trash
	public function restore($fileOrDirectory);

	// @emptyTrash delete all files present in trash
	public function emptyTrash($group);

	// @restoreTrash restores all files present in trash
	public function restoreTrash($group);

	//TO document
	public function getObject($fileOrDirectory);

	//TO document
	public function upload($group, $directory, $file, $uploader, $detached=false);

	//TO document
	public function download($group, $file, $download);

}