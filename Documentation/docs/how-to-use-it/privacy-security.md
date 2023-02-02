# 🔒 Privacy

You will find everything related to privacy in this document [https://twake.app/en/privacy/](https://twake.app/en/privacy/).

At Twake we are committed to protecting your privacy. We implemented specific security features to ensure that your data is safe and secure.

## General presentation of Twake

Twake is available in two main versions :

- SaaS : Twake as a service (SaaS available on twake.app)
- On-Premise : Twake on-premise (on private servers or on dedicated servers managed by
  Twake)

The Twake SaaS version is hosted in France by a French infrastructure provider. All servers are located in Paris (UE).

The Twake On-Premise version can be deployed on any local server and can work fully disconnected from the Internet or with an unique and unidirectional connection to twake.app for licencing management, mailing and iOS and Android push notifications (that are not available without additional configuration in fully disconnected mode).

On SaaS version, Twake provide two main tiers softwares :

- ONLYOFFICE spreadsheet, ONLYOFFICE document and ONLYOFFICE presentation, https://
  onlyoffice.com
- Jitsi video-conferencing, https://jitsi.org/

On the On-Premise version those softwares are optionals.

## Quick FAQ about Twake security

#### Where are your servers ?

Twake servers are all in France, in Paris.

#### Are you GRPD compliant ?

Yes ! As you can see in this document, we do everything we can do to protect your personal and professional data. Concerning your password and personal data specifically, passwords are hashed using PBKDF2, your data is encrypted before to be sent to the database (encryption at rest on the application layer) and we use TLS.0 for communications (encryption on transit). Moreover, we do not require any personal data in order for you to use our software, you can use Twake without disclosing personal information.

#### What protocol do you use ?

We use HTTPS for unidirectional traffic encryption and WSS for bidirectional realtime traffic encryption. Passwords are hashed with PBKDF2. Files are encrypted with OpenSSL AES-256-CBC with a key composed of three parts stored in database, in code and in the server configuration. Finally our database data is encrypted with OpenSSL AES-256-CBC. In order to always improve our security, next version of Twake will include full end-to-end encryption for direct and private channels using the Matrix protocol.

#### How do you manage backups ?

We backup our encrypted database and your encrypted documents in a replicated Object Storage. We keep a backup of each month and a backup of each of the last seven days.

#### What if I want to export all my data ?

We do not provide an export feature on the software itself. But we have the ability to export your data on-demand, please contact us for more information.

#### Can I delete my account and erase my data ?

Yes, you can delete your account and erase your data. To proceed, open your account from the "console" and click on "Delete my account". You will be asked to confirm your choice. Once your account is deleted, you will not be able to access it anymore.

#### How do you manage security with tiers applications and modules ?

We cannot guarantee the security of the data you send to tiers applications and modules. If you work with an external app like Zapier or Giphy, they will have access to some of your information. You can see the access scope of an application before to add it to your company.

## High availability

Twake is built on scalable technologies and allow us to scale to million users but also to be fault tolerant. We define two kind of replication, hardware replication and software replication:

Hardware replication in case of hard disk crash or network issue is managed by our infrastructure provider, you will find more details on how they manage this following these links:

- Servers: https://www.ovhcloud.com/en/public-cloud/
- Object storage and backups: https://www.ovhcloud.com/en/public-cloud/object-storage/

Software replication is done by ourself. Each middleware and nodes used by Twake are replicated at least three time. In the rare case of node failure, our system automatically alerts us and start using the remaining available node until we operate and fix the broken one.

## Application encryption

Data are stored encrypted in ScyllaDB and searchable entities will be stored in Elastic Search.

#### ScyllaDB

Any data (except non-sensible data like identifiers, dates and counters) stored in ScyllaDB is encrypted using OpenSSL AES-256-CBC before being sent to the database.

#### Indexed search storage

We provide advanced search features to our product Twake using Elastic Search to index our entities. Entities are not stored in Elastic Search and only indexes will be available if Twake Elastic Search servers are compromised.

## Other

#### Random token generation

For random generation we use the PHP built-in random_bytes function with bin2hex if needed on PHP side and the crypto library with randomBytes from NodeJS and frontend side.

#### Passwords storage and authentication

Passwords are not stored in clear, only a hash of it is stored in database. We use the hash_pbkdf2 method with a randomly generated salt for each user.

#### SQL Injection

Each database access use Doctrine ORM sanitisation before write or reads, we never use custom access to the database to reduce risks of injection. We developed a middleware to use ScyllaDB databases but this middleware works after Doctrine ORM sanitisation.
On NodeJS, we also implemented an ORM for all database access in order to keep this level of security.

#### XSS

We use React as front-end framework and we never execute tiers Javascript. External apps are loaded in webviews or iframes and use a bridge designed like a router for data exchange between frames.

## Continuous security checks

- We use Snyk to ensure that our dependencies are up to date and secure.
- We are active on huntr.dev to ensure that we fix all security issues reported by the community.
