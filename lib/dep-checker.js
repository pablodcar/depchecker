'use strict';

var _ = require('lodash');
var Q = require('q');
var semver = require('semver');

module.exports = function(options) {

  var gitHubApi = options.gitHubApi;

  function tagUpdated(event) {

    if (event.ref_type != 'tag') return null;

    var dependency = event.repository.git_url.split('.git')[0];
    var re = new RegExp(dependency + '#(.*)');
    var expectedNewValue = dependency + '#' + event.ref;

    var tagObject = {
      dependency: dependency,
      tag: event.ref,
      repoName: event.repository.name,
      fullName: event.repository.full_name,
      mustReplaceDependency: mustReplaceDependency,
      replaceDependency: replaceDependency
    };

    function mustReplaceDependency(dependencyValue) {
      var match = re.exec(dependencyValue);
      var requirementValue = match ? match[1] : null;
      var versionsValid = semver.valid(requirementValue) && semver.valid(tagObject.tag);
      if (!versionsValid) {
        return false;
      }

      return semver.lt(requirementValue, tagObject.tag);
    }

    function replaceDependency(dependencyValue) {
      if (mustReplaceDependency(dependencyValue)) {
        return expectedNewValue;
      } else {
        return dependencyValue;
      }
    }

    return tagObject;

  }

  function convertToRepoObject(rawRepoData) {

    return {
      rawData: rawRepoData,
      id: rawRepoData.id,
      name: rawRepoData.name,
      fullName: rawRepoData.full_name,
      contentsUrl: rawRepoData.contents_url,
      getPackageJson: function getPackageJson() {
        return gitHubApi.getPackageJson(rawRepoData);
      }
    };

  }

  function excludeUpdated(tag, repos) {
    return _.chain(repos)
      .filter(function filterDependant(repo) {
        return repo.full_name != tag.fullName;
      })
      .map(convertToRepoObject).value();
  }

  function getReposWithPackageJson(reposObjects) {
    var promiseOfReposWithPackage = _.map(reposObjects, function withPackageJson(repo) {
      return repo.getPackageJson()
        .then(function setPackageJson(textPackageJson) {
          if (!!textPackageJson) {
            var parsedPackageJson = JSON.parse(textPackageJson);
            repo.packageJson = {
              raw: textPackageJson,
              object: parsedPackageJson
            };
          }
          return repo;
        });
    });
    return Q.all(promiseOfReposWithPackage)
      .then(function excludeReposWithoutPackage(repos) {
        return _.filter(repos, function filterWithPackageJson(repo) {
          return !!repo.packageJson;
        });
      });

  }

  function getDependantsRepos(tagUpdated, reposObjects) {
    return _.filter(reposObjects, function filterWithDependency(repo) {
      var dependencies = _.values(repo.packageJson.object.dependencies);
      return _.findIndex(dependencies, tagUpdated.mustReplaceDependency) > -1;
    });
  }

  function updatedRepos(tagUpdated, reposObjects) {
    return _.map(reposObjects, function updateRepo(repo) {
      repo.changes = {};
      var newPackageJson = _.clone(repo.packageJson);
      newPackageJson.dependencies = _.mapValues(repo.packageJson.object.dependencies, function updateDependency(dependencyValue) {
        var newDependency = tagUpdated.replaceDependency(dependencyValue);
        if (dependencyValue !== newDependency) {
          repo.changes[dependencyValue] = newDependency;
          newPackageJson.raw = newPackageJson.raw.replace(dependencyValue, newDependency);
          newPackageJson.tagUpdated = tagUpdated;
        }
        return newDependency;
      });
      repo.newPackageJson = newPackageJson;
      return repo;
    });
  }

  function getRepos() {
    return gitHubApi.getRepos();
  }

  function pullRequest(repo) {
    return gitHubApi.getHeadMasterReference(repo)
      .then(function createTree(reference) {
        var shaReference = reference.object.sha;
        var repoName = repo.name;
        var path = 'package.json';
        var content = repo.newPackageJson.raw;
        return gitHubApi.createTree(shaReference, repoName, path, content)
          .then(function returnCommitContext(tree) {
            return {
              tree: tree,
              parentSHA: shaReference,
              repoName: repoName
            };
          });
      })
      .then(function createCommit(commitContext) {
        var treeSHA = commitContext.tree.sha;
        var parentSHA = commitContext.parentSHA;
        var repoName = commitContext.repoName;
        var commitMessage = 'Automated commit from Dependency Checker';
        var author = {
          date: new Date().toISOString(),
          name: 'Dependency Checker',
          email: 'dep.checker@example.com'
        };
        return gitHubApi.createCommit(treeSHA, parentSHA, repoName, commitMessage, author)
          .then(function returnReferenceContext(commit) {
            return {
              commitSHA: commit.sha,
              repoName: repoName
            };
          });
      })
      .then(function createReference(refContext) {
        var refName = repo.newPackageJson.tagUpdated.repoName + '-' + repo.newPackageJson.tagUpdated.tag;
        return gitHubApi.createReference(refContext.repoName, refContext.commitSHA, refName)
          .then(function createPullRequest(reference) {
            return {
              referenceName: reference.ref,
              repoName: refContext.repoName
            };
          });
      })
      .then(function createPullRequest(prContext) {
        return gitHubApi.createPullRequest(prContext.repoName, prContext.referenceName)
          .then(function prAndRepo(pullRequest) {
            return {
              repo: repo,
              pullRequest: pullRequest
            };
          });
      });
  }

  return {
    tagUpdated: tagUpdated,
    excludeUpdated: excludeUpdated,
    getReposWithPackageJson: getReposWithPackageJson,
    getDependantsRepos: getDependantsRepos,
    updatedRepos: updatedRepos,
    getRepos: getRepos,
    pullRequest: pullRequest
  };

};