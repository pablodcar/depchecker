'use strict';

var GitHubApi = require('github');
var Q = require('q');

exports.gitHubApi = function gitHubApi(options) {

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

  if (options.authentication_type === 'oauth') {
    var clientId = options.credentials[0];
    var clientSecret = options.credentials[1];
    github.authenticate({
      type: 'oauth',
      key: clientId,
      secret: clientSecret
    });
  } else if (options.authentication_type === 'token') {
    github.authenticate({
      type: 'token',
      token: options.credentials
    });
  } else {
    var username = options.credentials[0];
    var password = options.credentials[1];
    github.authenticate({
      type: 'basic',
      username: username,
      password: password
    });
  }

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
    },
    getHeadMasterReference: function getHeadMasterReference(repo) {
      return Q.nfcall(github.gitdata.getReference, {
        user: organization,
        repo: repo.name,
        ref: 'heads/master'
      });
    },
    createTree: function createTree(shaReference, repoName, path, content) {
      var treeData = {
        base_tree: shaReference,
        user: organization,
        repo: repoName,
        tree: [{
          path: path,
          mode: '100644',
          type: 'blob',
          content: content
        }]
      };
      console.log('createTree: ' + repoName);
      console.log(treeData);
      return Q.nfcall(github.gitdata.createTree, treeData);
    },
    createCommit: function createCommit(treeSHA, parentSHA, repoName, commitMessage, author) {
      var commitParams = {
        user: organization,
        repo: repoName,
        message: commitMessage,
        tree: treeSHA,
        parents: [
          parentSHA // -> Master lastcommit
        ],
        author: author
      };
      console.log('createCommit: ' + repoName);
      console.log(commitParams);
      return Q.nfcall(github.gitdata.createCommit, commitParams);
    },
    createReference: function createReference(repoName, commitSHA, refName) {
      var referenceParams = {
        user: organization,
        repo: repoName,
        ref: 'refs/heads/' + refName,
        sha: commitSHA
      };
      console.log('createReference: ' + repoName);
      console.log(referenceParams);
      return Q.nfcall(github.gitdata.createReference, referenceParams);
    },
    createPullRequest: function createPullRequest(repoName, referenceName) {
      var pullRequestParams = {
        user: organization,
        repo: repoName,
        title: 'Automated PR to update lib',
        body: '',
        base: 'master',
        head: referenceName
      };
      console.log('createPullRequest: ' + repoName);
      console.log(pullRequestParams);
      return Q.nfcall(github.pullRequests.create, pullRequestParams);
    }
  };
};