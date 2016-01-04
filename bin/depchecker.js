#!/usr/bin/env node

'use strict';

var depchecker = require('../lib/dep-checker.js');
var github = require('../lib/github.js');
var _ = require('lodash');

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

var createEvent = {
  ref_type: 'tag',
  ref: tag,
  repository: {
    git_url: dependency
  },
  organization: {
    login: organization
  }
};

var gitHubApi = github.gitHubApi({
  credentials: credentials,
  organization: organization
});
var options = {
  dependency: dependency,
  gitHubApi: gitHubApi
};

var depChecker = depchecker(options);

function printRepos(repos) {
  console.log(_.map(repos, function(repo) {
    return 'Repo: ' + repo.fullName + '\n' +
      _.map(repo.changes, function(changeValue, changeKey) {
        return 'From: ' + changeKey + ', To: ' + changeValue;
      }).join('\n');
  }).join('//////////////////////////////////////\n'));
}

function unupdatedRepos(error, repos) {
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
    .done(printRepos);
}

function printChanges() {
  gitHubApi.getRepos(unupdatedRepos);
}

if (require.main === module) {
  printChanges();
}