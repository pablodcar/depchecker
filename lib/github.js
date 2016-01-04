'use strict';

var GitHubApi = require('github');
var Q = require('q');

exports.gitHubApi = function gitHubApi(options) {

  var username = options.credentials[0];
  var password = options.credentials[1];
  var organization = options.organization;

  var github = new GitHubApi({
    version: '3.0.0',
    debug: false,
    protocol: 'https',
    host: 'api.github.com', // should be api.github.com for GitHub
    timeout: 5000,
    headers: {
      'user-agent': 'Dependency-Checker-APP' // GitHub is happy with a unique user agent
    }
  });

  github.authenticate({
    type: 'basic',
    username: username,
    password: password
  });

  return {
    getPackageJson: function getPackageJson(rawRepoData) {
      return Q.nfcall(github.repos.getContent, {
        user: rawRepoData.owner.login,
        repo: rawRepoData.name,
        path: 'package.json'
      }).then(function readContent(packageJson) {
        return new Buffer(packageJson.content, packageJson.encoding).toString();
      });
    },
    getRepos: function getRepos(callback) {
      github.repos.getFromOrg({
        org: organization
      }, callback);
    }
  };

};

exports.gitHubApiMock = function gitHubApiMock() {

};