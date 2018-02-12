<?php
/**
 * @file
 * ApnsPHP_Abstract class definition.
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
 * @mainpage
 *
 * @li ApnsPHP on GitHub: https://github.com/immobiliare/ApnsPHP
 */

/**
 * @defgroup ApplePushNotificationService ApnsPHP
 */

/**
 * Abstract class: this is the superclass for all Apple Push Notification Service
 * classes.
 *
 * This class is responsible for the connection to the Apple Push Notification Service
 * and Feedback.
 *
 * @ingroup ApplePushNotificationService
 * @see http://tinyurl.com/ApplePushNotificationService
 */
abstract class ApnsPHP_Abstract
{
	const ENVIRONMENT_PRODUCTION = 0; /**< @type integer Production environment. */
	const ENVIRONMENT_SANDBOX = 1; /**< @type integer Sandbox environment. */

	const DEVICE_BINARY_SIZE = 32; /**< @type integer Device token length. */

	const WRITE_INTERVAL = 10000; /**< @type integer Default write interval in micro seconds. */
	const CONNECT_RETRY_INTERVAL = 1000000; /**< @type integer Default connect retry interval in micro seconds. */
	const SOCKET_SELECT_TIMEOUT = 1000000; /**< @type integer Default socket select timeout in micro seconds. */

	protected $_aServiceURLs = array(); /**< @type array Container for service URLs environments. */

	protected $_nEnvironment; /**< @type integer Active environment. */

	protected $_nConnectTimeout; /**< @type integer Connect timeout in seconds. */
	protected $_nConnectRetryTimes = 3; /**< @type integer Connect retry times. */

	protected $_sProviderCertificateFile; /**< @type string Provider certificate file with key (Bundled PEM). */
	protected $_sProviderCertificatePassphrase; /**< @type string Provider certificate passphrase. */
	protected $_sRootCertificationAuthorityFile; /**< @type string Root certification authority file. */

	protected $_nWriteInterval; /**< @type integer Write interval in micro seconds. */
	protected $_nConnectRetryInterval; /**< @type integer Connect retry interval in micro seconds. */
	protected $_nSocketSelectTimeout; /**< @type integer Socket select timeout in micro seconds. */

	protected $_logger; /**< @type ApnsPHP_Log_Interface Logger. */

	protected $_hSocket; /**< @type resource SSL Socket. */

	/**
	 * Constructor.
	 *
	 * @param  $nEnvironment @type integer Environment.
	 * @param  $sProviderCertificateFile @type string Provider certificate file
	 *         with key (Bundled PEM).
	 * @throws ApnsPHP_Exception if the environment is not
	 *         sandbox or production or the provider certificate file is not readable.
	 */
	public function __construct($nEnvironment, $sProviderCertificateFile)
	{
		if ($nEnvironment != self::ENVIRONMENT_PRODUCTION && $nEnvironment != self::ENVIRONMENT_SANDBOX) {
			throw new ApnsPHP_Exception(
				"Invalid environment '{$nEnvironment}'"
			);
		}
		$this->_nEnvironment = $nEnvironment;

		if (!is_readable($sProviderCertificateFile)) {
			throw new ApnsPHP_Exception(
				"Unable to read certificate file '{$sProviderCertificateFile}'"
			);
		}
		$this->_sProviderCertificateFile = $sProviderCertificateFile;

		$this->_nConnectTimeout = ini_get("default_socket_timeout");
		$this->_nWriteInterval = self::WRITE_INTERVAL;
		$this->_nConnectRetryInterval = self::CONNECT_RETRY_INTERVAL;
		$this->_nSocketSelectTimeout = self::SOCKET_SELECT_TIMEOUT;
	}

	/**
	 * Set the Logger instance to use for logging purpose.
	 *
	 * The default logger is ApnsPHP_Log_Embedded, an instance
	 * of ApnsPHP_Log_Interface that simply print to standard
	 * output log messages.
	 *
	 * To set a custom logger you have to implement ApnsPHP_Log_Interface
	 * and use setLogger, otherwise standard logger will be used.
	 *
	 * @see ApnsPHP_Log_Interface
	 * @see ApnsPHP_Log_Embedded
	 *
	 * @param  $logger @type ApnsPHP_Log_Interface Logger instance.
	 * @throws ApnsPHP_Exception if Logger is not an instance
	 *         of ApnsPHP_Log_Interface.
	 */
	public function setLogger(ApnsPHP_Log_Interface $logger)
	{
		if (!is_object($logger)) {
			throw new ApnsPHP_Exception(
				"The logger should be an instance of 'ApnsPHP_Log_Interface'"
			);
		}
		if (!($logger instanceof ApnsPHP_Log_Interface)) {
			throw new ApnsPHP_Exception(
				"Unable to use an instance of '" . get_class($logger) . "' as logger: " .
				"a logger must implements ApnsPHP_Log_Interface."
			);
		}
		$this->_logger = $logger;
	}

	/**
	 * Get the Logger instance.
	 *
	 * @return @type ApnsPHP_Log_Interface Current Logger instance.
	 */
	public function getLogger()
	{
		return $this->_logger;
	}

	/**
	 * Set the Provider Certificate passphrase.
	 *
	 * @param  $sProviderCertificatePassphrase @type string Provider Certificate
	 *         passphrase.
	 */
	public function setProviderCertificatePassphrase($sProviderCertificatePassphrase)
	{
		$this->_sProviderCertificatePassphrase = $sProviderCertificatePassphrase;
	}

	/**
	 * Set the Root Certification Authority file.
	 *
	 * Setting the Root Certification Authority file automatically set peer verification
	 * on connect.
	 *
	 * @see http://tinyurl.com/GeneralProviderRequirements
	 * @see http://www.entrust.net/
	 * @see https://www.entrust.net/downloads/root_index.cfm
	 *
	 * @param  $sRootCertificationAuthorityFile @type string Root Certification
	 *         Authority file.
	 * @throws ApnsPHP_Exception if Root Certification Authority
	 *         file is not readable.
	 */
	public function setRootCertificationAuthority($sRootCertificationAuthorityFile)
	{
		if (!is_readable($sRootCertificationAuthorityFile)) {
			throw new ApnsPHP_Exception(
				"Unable to read Certificate Authority file '{$sRootCertificationAuthorityFile}'"
			);
		}
		$this->_sRootCertificationAuthorityFile = $sRootCertificationAuthorityFile;
	}

	/**
	 * Get the Root Certification Authority file path.
	 *
	 * @return @type string Current Root Certification Authority file path.
	 */
	public function getCertificateAuthority()
	{
		return $this->_sRootCertificationAuthorityFile;
	}

	/**
	 * Set the write interval.
	 *
	 * After each socket write operation we are sleeping for this 
	 * time interval. To speed up the sending operations, use Zero
	 * as parameter but some messages may be lost.
	 *
	 * @param  $nWriteInterval @type integer Write interval in micro seconds.
	 */
	public function setWriteInterval($nWriteInterval)
	{
		$this->_nWriteInterval = (int)$nWriteInterval;
	}

	/**
	 * Get the write interval.
	 *
	 * @return @type integer Write interval in micro seconds.
	 */
	public function getWriteInterval()
	{
		return $this->_nWriteInterval;
	}

	/**
	 * Set the connection timeout.
	 *
	 * The default connection timeout is the PHP internal value "default_socket_timeout".
	 * @see http://php.net/manual/en/filesystem.configuration.php
	 *
	 * @param  $nTimeout @type integer Connection timeout in seconds.
	 */
	public function setConnectTimeout($nTimeout)
	{
		$this->_nConnectTimeout = (int)$nTimeout;
	}

	/**
	 * Get the connection timeout.
	 *
	 * @return @type integer Connection timeout in seconds.
	 */
	public function getConnectTimeout()
	{
		return $this->_nConnectTimeout;
	}

	/**
	 * Set the connect retry times value.
	 *
	 * If the client is unable to connect to the server retries at least for this
	 * value. The default connect retry times is 3.
	 *
	 * @param  $nRetryTimes @type integer Connect retry times.
	 */
	public function setConnectRetryTimes($nRetryTimes)
	{
		$this->_nConnectRetryTimes = (int)$nRetryTimes;
	}

	/**
	 * Get the connect retry time value.
	 *
	 * @return @type integer Connect retry times.
	 */
	public function getConnectRetryTimes()
	{
		return $this->_nConnectRetryTimes;
	}

	/**
	 * Set the connect retry interval.
	 *
	 * If the client is unable to connect to the server retries at least for ConnectRetryTimes
	 * and waits for this value between each attempts.
	 *
	 * @see setConnectRetryTimes
	 *
	 * @param  $nRetryInterval @type integer Connect retry interval in micro seconds.
	 */
	public function setConnectRetryInterval($nRetryInterval)
	{
		$this->_nConnectRetryInterval = (int)$nRetryInterval;
	}

	/**
	 * Get the connect retry interval.
	 *
	 * @return @type integer Connect retry interval in micro seconds.
	 */
	public function getConnectRetryInterval()
	{
		return $this->_nConnectRetryInterval;
	}

	/**
	 * Set the TCP socket select timeout.
	 *
	 * After writing to socket waits for at least this value for read stream to
	 * change status.
	 *
	 * In Apple Push Notification protocol there isn't a real-time
	 * feedback about the correctness of notifications pushed to the server; so after
	 * each write to server waits at least SocketSelectTimeout. If, during this
	 * time, the read stream change its status and socket received an end-of-file
	 * from the server the notification pushed to server was broken, the server
	 * has closed the connection and the client needs to reconnect.
	 *
	 * @see http://php.net/stream_select
	 *
	 * @param  $nSelectTimeout @type integer Socket select timeout in micro seconds.
	 */
	public function setSocketSelectTimeout($nSelectTimeout)
	{
		$this->_nSocketSelectTimeout = (int)$nSelectTimeout;
	}

	/**
	 * Get the TCP socket select timeout.
	 *
	 * @return @type integer Socket select timeout in micro seconds.
	 */
	public function getSocketSelectTimeout()
	{
		return $this->_nSocketSelectTimeout;
	}

	/**
	 * Connects to Apple Push Notification service server.
	 *
	 * Retries ConnectRetryTimes if unable to connect and waits setConnectRetryInterval
	 * between each attempts.
	 *
	 * @see setConnectRetryTimes
	 * @see setConnectRetryInterval
	 * @throws ApnsPHP_Exception if is unable to connect after
	 *         ConnectRetryTimes.
	 */
	public function connect()
	{
		$bConnected = false;
		$nRetry = 0;
		while (!$bConnected) {
			try {
				$bConnected = $this->_connect();
			} catch (ApnsPHP_Exception $e) {
				$this->_log('ERROR: ' . $e->getMessage());
				if ($nRetry >= $this->_nConnectRetryTimes) {
					throw $e;
				} else {
					$this->_log(
						"INFO: Retry to connect (" . ($nRetry+1) .
						"/{$this->_nConnectRetryTimes})..."
					);
					usleep($this->_nConnectRetryInterval);
				}
			}
			$nRetry++;
		}
	}

	/**
	 * Disconnects from Apple Push Notifications service server.
	 *
	 * @return @type boolean True if successful disconnected.
	 */
	public function disconnect()
	{
		if (is_resource($this->_hSocket)) {
			$this->_log('INFO: Disconnected.');
			return fclose($this->_hSocket);
		}
		return false;
	}

	/**
	 * Connects to Apple Push Notification service server.
	 *
	 * @throws ApnsPHP_Exception if is unable to connect.
	 * @return @type boolean True if successful connected.
	 */
	protected function _connect()
	{
		$sURL = $this->_aServiceURLs[$this->_nEnvironment];
		unset($aURLs);

		$this->_log("INFO: Trying {$sURL}...");

		/**
		 * @see http://php.net/manual/en/context.ssl.php
		 */
		$streamContext = stream_context_create(array('ssl' => array(
			'verify_peer' => isset($this->_sRootCertificationAuthorityFile),
			'cafile' => $this->_sRootCertificationAuthorityFile,
			'local_cert' => $this->_sProviderCertificateFile
		)));

		if (!empty($this->_sProviderCertificatePassphrase)) {
			stream_context_set_option($streamContext, 'ssl',
				'passphrase', $this->_sProviderCertificatePassphrase);
		}

		$this->_hSocket = @stream_socket_client($sURL, $nError, $sError,
			$this->_nConnectTimeout, STREAM_CLIENT_CONNECT, $streamContext);

		if (!$this->_hSocket) {
			throw new ApnsPHP_Exception(
				"Unable to connect to '{$sURL}': {$sError} ({$nError})"
			);
		}

		stream_set_blocking($this->_hSocket, 0);
		stream_set_write_buffer($this->_hSocket, 0);

		$this->_log("INFO: Connected to {$sURL}.");

		return true;
	}

	/**
	 * Logs a message through the Logger.
	 *
	 * @param  $sMessage @type string The message.
	 */
	protected function _log($sMessage)
	{
		if (!isset($this->_logger)) {
			$this->_logger = new ApnsPHP_Log_Embedded();
		}
		$this->_logger->log($sMessage);
	}
}
