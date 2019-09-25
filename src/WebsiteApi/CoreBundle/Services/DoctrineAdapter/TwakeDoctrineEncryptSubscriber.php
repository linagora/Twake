<?php

namespace Reprovinci\DoctrineEncrypt\Subscribers;

use Doctrine\Common\Annotations\Reader;
use Doctrine\Common\EventSubscriber;

use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\Events;

use Reprovinci\DoctrineEncrypt\Encryptors\EncryptorInterface;

use ReflectionClass;

/**
 * Doctrine event subscriber which encrypt/decrypt entities
 */
class DoctrineEncryptSubscriber implements EventSubscriber
{
    /**
     * Encryptor interface namespace
     */
    const ENCRYPTOR_INTERFACE_NS = 'Reprovinci\DoctrineEncrypt\Encryptors\EncryptorInterface';

    /**
     * Encrypted annotation full name
     */
    const ENCRYPTED_ANN_NAME = 'Reprovinci\DoctrineEncrypt\Configuration\Encrypted';

    /**
     * Encryptor
     * @var EncryptorInterface
     */
    private $encryptor;

    /**
     * Annotation reader
     * @var Doctrine\Common\Annotations\Reader
     */
    private $annReader;

    /**
     * Registr to avoid multi decode operations for one entity
     * @var array
     */
    private $decodedRegistry = array();

    /**
     * Initialization of subscriber
     * @param Reader $annReader
     * @param EncryptorInterface $encryptor
     */
    public function __construct(Reader $annReader, EncryptorInterface $encryptor)
    {
        $this->annReader = $annReader;
        $this->encryptor = $encryptor;
    }

    /**
     * Listen a prePersist lifecycle event. Checking and encrypt entities
     * which have @Encrypted annotation
     * @param LifecycleEventArgs $args
     */
    public function prePersist(LifecycleEventArgs $args)
    {
        $entity = $args->getEntity();
        $this->processFields($entity);
    }

    /**
     * Listen a preUpdate lifecycle event. Checking and encrypt entities fields
     * which have @Encrypted annotation. Using changesets to avoid preUpdate event
     * restrictions
     * @param LifecycleEventArgs $args
     */
    public function preUpdate(PreUpdateEventArgs $args)
    {
        $reflectionClass = new ReflectionClass($args->getEntity());
        $properties = $reflectionClass->getProperties();
        foreach ($properties as $refProperty) {
            if ($this->annReader->getPropertyAnnotation($refProperty, self::ENCRYPTED_ANN_NAME)) {
                $propName = $refProperty->getName();
                if ($args->hasChangedField($propName)) {
                    $args->setNewValue($propName, $this->encryptor->encrypt($args->getNewValue($propName)));
                }
            }
        }
    }

    /**
     * Listen a postLoad lifecycle event. Checking and decrypt entities
     * which have @Encrypted annotations
     * @param LifecycleEventArgs $args
     */
    public function postLoad(LifecycleEventArgs $args)
    {
        $entity = $args->getEntity();
        if (!$this->hasInDecodedRegistry($entity, $args->getEntityManager())) {
            if ($this->processFields($entity, false)) {
                $this->addToDecodedRegistry($entity, $args->getEntityManager());
            }
        }

    }

    /**
     * Realization of EventSubscriber interface method.
     * @return Array Return all events which this subscriber is listening
     */
    public function getSubscribedEvents()
    {
        return array(
            Events::prePersist,
            Events::preUpdate,
            Events::postLoad,
        );
    }

    /**
     * Capitalize string
     * @param string $word
     * @return string
     */
    public static function capitalize($word)
    {
        if (is_array($word)) {
            $word = $word[0];
        }

        return str_replace(' ', '', ucwords(str_replace(array('-', '_'), ' ', $word)));
    }

    /**
     * Process (encrypt/decrypt) entities fields
     * @param Obj $entity Some doctrine entity
     * @param Boolean $isEncryptOperation If true - encrypt, false - decrypt entity
     */
    private function processFields($entity, $isEncryptOperation = true)
    {
        $encryptorMethod = $isEncryptOperation ? 'encrypt' : 'decrypt';
        $reflectionClass = new ReflectionClass($entity);
        $properties = $reflectionClass->getProperties();
        $withAnnotation = false;
        foreach ($properties as $refProperty) {
            if ($this->annReader->getPropertyAnnotation($refProperty, self::ENCRYPTED_ANN_NAME)) {
                $withAnnotation = true;
                // we have annotation and if it decrypt operation, we must avoid duble decryption
                $refProperty->setAccessible(true);
                $value = $refProperty->getValue($entity);

                $value = $this->encryptor->$encryptorMethod($value);
                $refProperty->setValue($entity, $value);
            }
        }

        return $withAnnotation;
    }

    /**
     * Check if we have entity in decoded registry
     * @param Object $entity Some doctrine entity
     * @param \Doctrine\ORM\EntityManager $em
     * @return boolean
     */
    private function hasInDecodedRegistry($entity, EntityManager $em)
    {
        $className = get_class($entity);
        $metadata = $em->getClassMetadata($className);
        $getter = 'get' . self::capitalize($metadata->getIdentifier());

        return isset($this->decodedRegistry[$className][(string)$entity->$getter()]);
    }

    /**
     * Adds entity to decoded registry
     * @param object $entity Some doctrine entity
     * @param \Doctrine\ORM\EntityManager $em
     */
    private function addToDecodedRegistry($entity, EntityManager $em)
    {
        $className = get_class($entity);
        $metadata = $em->getClassMetadata($className);
        $getter = 'get' . self::capitalize($metadata->getIdentifier());
        error_log($className);
        error_log($getter);
        $this->decodedRegistry[$className][(string)$entity->$getter()] = true;
    }
}
