<?php
/**
 * @file
 * ApnsPHP_Log_Interface interface definition.
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
 * @defgroup ApnsPHP_Log Log
 * @ingroup ApplePushNotificationService
 */

/**
 * The Log Interface.
 *
 * Implement the Log Interface and pass the object instance to all
 * ApnsPHP_Abstract based class to use a custom log.
 *
 * @ingroup ApnsPHP_Log
 */
interface ApnsPHP_Log_Interface
{
	/**
	 * Logs a message.
	 *
	 * @param  $sMessage @type string The message.
	 */
	public function log($sMessage);
}
