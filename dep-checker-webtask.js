'use strict';

var depchecker = require('./lib/dep-checker.js');
var github = require('./lib/github.js');
var _ = require('lodash');
var Q = require('q');

module.exports = function(ctx, done) {

  console.log('Event Received');
  console.log(ctx);

  var createEvent = ctx.body;

  var organization = createEvent.organization.login;
  var dependency = createEvent.repository.git_url;

  var gitHubApi = github.gitHubApi({
    credentials: ctx.data.GITHUB_TOKEN,
    authentication_type: 'token',
    organization: organization
  });

  var options = {
    dependency: dependency,
    gitHubApi: gitHubApi
  };

  var depChecker = depchecker(options);
  var tagUpdated = depChecker.tagUpdated(createEvent);
  if (!!!tagUpdated) {
    console.log('Create event was not for a tag, ignoring ...');
    done(null, 'Create event was not for a tag, ignoring ...');
    return;
  }

  function renderPrs(prsAndRepos) {
    var changes = {};

    _.each(prsAndRepos, function(repoPr) {
      changes[repoPr.repo.fullName] = _.map(repoPr.repo.changes, function(changeValue, changeKey) {
        return {
          from: changeKey,
          to: changeValue,
          pullRequest: repoPr.pullRequest.url
        };
      });
    });
    return {
      changes: changes
    };
  }

  function updateRepos(error, repos) {
    if (error) {
      console.log(error);
      return;
    }
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
      .done(function(prsAndRepos) {
        done(null, renderPrs(prsAndRepos));
      });
  }

  gitHubApi.getRepos(updateRepos);

};