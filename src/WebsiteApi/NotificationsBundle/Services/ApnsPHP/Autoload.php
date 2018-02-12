<?php
/**
 * @file
 * Autoload stuff.
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://code.google.com/p/apns-php/wiki/License
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to aldo.armiento@gmail.com so we can send you a copy immediately.
 *
 * @author (C) 2010 Aldo Armiento (aldo.armiento@gmail.com)
 * @version $Id$
 */

/**
 * This function is automatically called in case you are trying to use a
 * class/interface which hasn't been defined yet. By calling this function the
 * scripting engine is given a last chance to load the class before PHP
 * fails with an error.
 *
 * @see http://php.net/__autoload
 * @see http://php.net/spl_autoload_register
 *
 * @param  $sClassName @type string The class name.
 * @throws Exception if class name is empty, the current path is empty or class
 *         file does not exists or file was loaded but class name was not found.
 */
function ApnsPHP_Autoload($sClassName)
{
	if (empty($sClassName)) {
		throw new Exception('Class name is empty');
	}

	$sPath = dirname(dirname(__FILE__));
	if (empty($sPath)) {
		throw new Exception('Current path is empty');
	}

	$sFile = sprintf('%s%s%s.php',
		$sPath, DIRECTORY_SEPARATOR,
		str_replace('_', DIRECTORY_SEPARATOR, $sClassName)
	);
	if (is_file($sFile) && is_readable($sFile)) {
		require_once $sFile;
	}
}

// If your code has an existing __autoload function then this function must be explicitly registered on the __autoload stack.
// (PHP Documentation for spl_autoload_register [@see http://php.net/spl_autoload_register])
if (function_exists('__autoload')) {
	spl_autoload_register('__autoload');
}
spl_autoload_register('ApnsPHP_Autoload');
