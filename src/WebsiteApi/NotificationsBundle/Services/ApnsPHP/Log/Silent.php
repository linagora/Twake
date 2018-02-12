<?php
/**
 * @file
 * ApnsPHP_Log_Silent class definition.
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
 * @author (C) 2017 Ohad Cohen (ohadcn@gmail.com)
 * @version $Id$
 */

/**
 * A simple logger.
 *
 * This simple logger implements the Log Interface.
 *
 * This simple logger ignore The Message and does nothing.
 * This class was built for web environment where all output should be omitted for not being sent to the client.
 *
 * @see ApnsPHP_Log_Error
 * @ingroup ApnsPHP_Log
 */
class ApnsPHP_Log_Silent implements ApnsPHP_Log_Interface
{
	/**
	 * Logs a message.
	 *
	 * @param  $sMessage @type string The message.
	 */
	public function log($sMessage)
	{

	}
}
