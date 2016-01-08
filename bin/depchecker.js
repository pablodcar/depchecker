#!/usr/bin/env node

'use strict';

var depchecker = require('../lib/dep-checker.js');
var github = require('../lib/github.js');
var _ = require('lodash');

function printChanges() {

  var argv = require('yargs')
    .usage(
      'List all the dependants repositories and required change\n' +
      'Usage: $0 -o [organization] -d [dependency] -t [tag] -c [username:password]'
    )
    .demand(['o', 'd', 't', 'c'])
    .describe('o', 'GitHub Organization where dependency should be searched')
    .describe('d', 'Dependency, only GitHub URL with pattern git://github.com/user/project.git is supported')
    .describe('t', 'New tag which repositories must depend on')
    .describe('c', 'Credentials for basic authentication to be used in Github API')
    .argv;

  var organization = argv.o;
  var dependency = argv.d;
  var tag = argv.t;
  var credentials = argv.c.split(':');
  var repoName = _.last(dependency.split('/'));

  var createEvent = {
    ref_type: 'tag',
    ref: tag,
    repository: {
      git_url: dependency,
      name: repoName,
      fullName: repoName
    },
    organization: {
      login: organization
    }
  };

  var gitHubApi = github.gitHubApi({
    credentials: credentials,
    authentication_type: 'token',
    organization: organization
  });
  var options = {
    dependency: dependency,
    gitHubApi: gitHubApi
  };

  var depChecker = depchecker(options);

  function printActions(prsAndRepos) {
    console.log(_.map(prsAndRepos, function(repoPr) {
      return 'Repo: ' + repoPr.repo.fullName + '\n' +
        _.map(repoPr.repo.changes, function(changeValue, changeKey) {
          return 'From: ' + changeKey + ', To: ' + changeValue +
            ', Pull Request: ' + repoPr.pullRequest.url;
        }).join('\n');
    }).join('//////////////////////////////////////\n'));
  }

  var Q = require('q');


  function updateRepos(error, repos) {
    if (error) {
      console.log(error);
      return;
    }
    var tagUpdated = depChecker.tagUpdated(createEvent);
    var reposExcludingDependency = depChecker.excludeUpdated(tagUpdated, repos);
    depChecker.getReposWithPackageJson(reposExcludingDependency)
      .then(function(repos) {
        return depChecker.getDependantsRepos(tagUpdated, repos);
      })
      .then(function(repos) {
        return depChecker.updatedRepos(tagUpdated, repos);
      })
      .then(function(repos) {
        var pullRequests = _.map(repos, depChecker.pullRequest);
        return Q.all(pullRequests);
      })
      .done(renderPrs);
  }

  gitHubApi.getRepos(updateRepos);
}

if (require.main === module) {
  printChanges();
}

module.exports = function depchecker() {
  return {
    printChanges: printChanges
  };
};