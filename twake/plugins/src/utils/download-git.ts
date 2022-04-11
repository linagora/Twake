var downloadUrl = require("download");
var gitclone = require("git-clone");
var rm = require("rimraf").sync;

/**
 * Download `repo` to `dest` and callback `fn(err)`.
 *
 * @param {String} repo
 * @param {String} dest
 * @param {Object} opts
 * @param {Function} fn
 */

export function download(repo: any, dest: string, opts: any, fn: Function) {
  if (typeof opts === "function") {
    fn = opts;
    opts = null;
  }
  opts = opts || {};
  var clone = opts.clone || false;
  delete opts.clone;

  repo = normalize(repo);
  var url = repo.url || getUrl(repo, clone);

  if (clone) {
    var cloneOptions = {
      checkout: repo.checkout,
      shallow: repo.checkout === "master",
      ...opts,
    };
    gitclone(url, dest, cloneOptions, function (err: any) {
      if (err === undefined) {
        rm(dest + "/.git");
        fn();
      } else {
        fn(err);
      }
    });
  } else {
    var downloadOptions = {
      extract: true,
      strip: 1,
      mode: "666",
      ...opts,
      headers: {
        accept: "application/zip",
        ...(opts.headers || {}),
      },
    };
    downloadUrl(url, dest, downloadOptions)
      .then(function (data: any) {
        fn();
      })
      .catch(function (err: any) {
        fn(err);
      });
  }
}

/**
 * Normalize a repo string.
 *
 * @param {String} repo
 * @return {Object}
 */

function normalize(repo: string) {
  var regex = /^(?:(direct):([^#]+)(?:#(.+))?)$/;
  var match = regex.exec(repo);

  if (match) {
    var url = match[2];
    var directCheckout = match[3] || "master";

    return {
      type: "direct",
      url: url,
      checkout: directCheckout,
    };
  } else {
    regex = /^(?:(github|gitlab|bitbucket):)?(?:(.+):)?([^/]+)\/([^#]+)(?:#(.+))?$/;
    match = regex.exec(repo);
    var type = match[1] || "github";
    var origin = match[2] || null;
    var owner = match[3];
    var name = match[4];
    var checkout = match[5] || "master";

    if (origin == null) {
      if (type === "github") {
        origin = "github.com";
      } else if (type === "gitlab") {
        origin = "gitlab.com";
      } else if (type === "bitbucket") {
        origin = "bitbucket.org";
      }
    }

    return {
      type: type,
      origin: origin,
      owner: owner,
      name: name,
      checkout: checkout,
    };
  }
}

/**
 * Adds protocol to url in none specified
 *
 * @param {String} url
 * @return {String}
 */

function addProtocol(origin: string, clone: string) {
  if (!/^(f|ht)tps?:\/\//i.test(origin)) {
    if (clone) {
      origin = "git@" + origin;
    } else {
      origin = "https://" + origin;
    }
  }

  return origin;
}

/**
 * Return a zip or git url for a given `repo`.
 *
 * @param {Object} repo
 * @return {String}
 */

function getUrl(repo: any, clone: string) {
  var url;

  // Get origin with protocol and add trailing slash or colon (for ssh)
  var origin = addProtocol(repo.origin, clone);
  if (/^git@/i.test(origin)) {
    origin = origin + ":";
  } else {
    origin = origin + "/";
  }

  // Build url
  if (clone) {
    url = origin + repo.owner + "/" + repo.name + ".git";
  } else {
    if (repo.type === "github") {
      url = origin + repo.owner + "/" + repo.name + "/archive/" + repo.checkout + ".zip";
    } else if (repo.type === "gitlab") {
      url = origin + repo.owner + "/" + repo.name + "/repository/archive.zip?ref=" + repo.checkout;
    } else if (repo.type === "bitbucket") {
      url = origin + repo.owner + "/" + repo.name + "/get/" + repo.checkout + ".zip";
    }
  }

  return url;
}
