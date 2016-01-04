'use strict';

var assert = require('assert');
var _ = require('lodash');
var depchecker = require('../lib/dep-checker.js');
var Q = require('q');

describe('DepChecker', function() {
  describe('Given a create tag event, dependency information is returned', function() {

    it('Dependency URI, tag & Repos endpoint is extracted from event', function() {

      var depChecker = getDepchecker();
      var event = getEvent();
      var tagUpdated = depChecker.tagUpdated(event);
      var expectedTag = {
        dependency: 'git://github.com/pablodcar-test/test-repo1',
        tag: '0.0.2',
        reposEndpoint: 'https://api.github.com/orgs/pablodcar-test/repos',
        fullName: 'pablodcar-test/test-repo1'
      };
      assert(_.matches(tagUpdated, expectedTag), 'Updated tag does not have expected values');

    });

    it('If the event is not a create tag event, null is returned as tag info', function() {

      var depChecker = getDepchecker();
      var event = getEvent();
      event.ref_type = 'repository';
      var tagUpdated = depChecker.tagUpdated(event);
      assert.equal(tagUpdated, null, 'When a create event is not for a tag, null is returned');

    });
  });

  describe('Given a list of repositories, they are filtered if they are not dependant', function() {

    it('The repo that is being tagged is not included as dependant repo', function() {

      var depChecker = getDepchecker();
      var repos = getRepos();
      var event = getEvent();
      var tagUpdated = depChecker.tagUpdated(event);
      assert.equal(tagUpdated.fullName, 'pablodcar-test/test-repo1');
      var nonUpdatedRepos = depChecker.excludeUpdated(tagUpdated, repos);
      assert(nonUpdatedRepos.length > 0, 'No dependant repos found');
      var listOfFullNames = _.map(nonUpdatedRepos, function(repo) {
        return repo.fullName;
      });
      assert(listOfFullNames.length > 0, 'No filtered repos');
      assert.equal(_.includes(listOfFullNames, tagUpdated.fullName), false,
        'Tagged repo was included as dependant');

    });

    it('Repos are filtered if package.json is not present', function(done) {

      var depChecker = getDepchecker({
        'pablodcar-test/test-repo1': 'test package json',
        'pablodcar-test/test-repo2': 'test package json',
        'pablodcar-test/test-repo3': null,
      });
      var repos = getRepos();
      var event = getEvent();
      var tagUpdated = depChecker.tagUpdated(event);
      var nonUpdatedRepos = depChecker.excludeUpdated(tagUpdated, repos);
      assert(nonUpdatedRepos.length > 0, 'No dependant repos found');
      depChecker.getReposWithPackageJson(nonUpdatedRepos)
        .done(function doAssertions(reposWithPackageJson) {
          assert.equal(
            _.find(reposWithPackageJson, _.matchesProperty('fullName', 'pablodcar-test/test-repo1')),
            undefined,
            'pablodcar-test/test-repo1 Must be excluded because it was updated');
          assert(
            _.find(reposWithPackageJson, _.matchesProperty('fullName', 'pablodcar-test/test-repo2')),
            'pablodcar-test/test-repo2 Must be included because it contains package.json file');
          assert.equal(
            _.find(reposWithPackageJson, _.matchesProperty('fullName', 'pablodcar-test/test-repo3')),
            undefined,
            'pablodcar-test/test-repo3 Must be excluded because it does not contain package.json file');
          done();
        });

    });

  });

  describe('Given a repo with package.json file unupdated dependency is detected', function() {

    it('Repos without the dependency in package.json are filtered', function(done) {
      var packageJson = getPackageJsonWithDependency();
      var packageJson2 = getPackageJsonWithDependency();
      packageJson2.dependencies = {
        'loadsh': 'latest'
      };
      var depChecker = getDepchecker({
        'pablodcar-test/test-repo1': packageJson,
        'pablodcar-test/test-repo2': packageJson,
        'pablodcar-test/test-repo3': packageJson2,
      });
      var repos = getRepos();
      var event = getEvent();
      var tagUpdated = depChecker.tagUpdated(event);
      var nonUpdatedRepos = depChecker.excludeUpdated(tagUpdated, repos);
      assert(nonUpdatedRepos.length > 0, 'No dependant repos found');
      depChecker.getReposWithPackageJson(nonUpdatedRepos)
        .done(function(reposWithPackageJson) {
          var dependantsRepo = depChecker.getDependantsRepos(tagUpdated, reposWithPackageJson);
          assert.equal(
            _.find(dependantsRepo, _.matchesProperty('fullName', 'pablodcar-test/test-repo1')),
            undefined,
            'test-repo1 is the updated repo and must not be included as depenant'
          );
          assert(
            _.find(dependantsRepo, _.matchesProperty('fullName', 'pablodcar-test/test-repo2')),
            'test-repo2 is depenant on created tag and was not included'
          );
          assert.equal(
            _.find(dependantsRepo, _.matchesProperty('fullName', 'pablodcar-test/test-repo3')),
            undefined,
            'test-repo3 is not depenant on created tag and was included'
          );
          done();
        });

    });

    it('Repos with dependency in package.json are replaced', function(done) {
      var packageJson = getPackageJsonWithDependency();
      var packageJson2 = getPackageJsonWithDependency();
      packageJson2.dependencies = {
        'loadsh': 'latest'
      };
      var depChecker = getDepchecker({
        'pablodcar-test/test-repo1': packageJson,
        'pablodcar-test/test-repo2': packageJson,
        'pablodcar-test/test-repo3': packageJson2,
      });
      var repos = getRepos();
      var event = getEvent();
      var tagUpdated = depChecker.tagUpdated(event);
      var nonUpdatedRepos = depChecker.excludeUpdated(tagUpdated, repos);
      assert(nonUpdatedRepos.length > 0, 'No dependant repos found');
      depChecker.getReposWithPackageJson(nonUpdatedRepos)
        .done(function(reposWithPackageJson) {
          var dependantsRepo = depChecker.getDependantsRepos(tagUpdated, reposWithPackageJson);
          var updatedRepos = depChecker.updatedRepos(tagUpdated, dependantsRepo);
          assert.equal(updatedRepos.length,
            1,
            'only "pablodcar-test/test-repo2" was expected to be replaced');
          var expectedChanges = {
            'git://github.com/pablodcar-test/test-repo1#0.0.1': 'git://github.com/pablodcar-test/test-repo1#0.0.2'
          };
          assert.deepEqual(updatedRepos[0].changes,
            expectedChanges,
            'Changes in package.json were not the expected');
          done();
        });
    });

  });

  function getDepchecker(packageJsonMap) {
    if (packageJsonMap) {
      return depchecker({
        gitHubApi: githubMock(packageJsonMap)
      });
    } else {
      return depchecker({
        gitHubApi: githubMock({})
      });
    }
  }

  function getEvent() {
    return {
      ref: '0.0.2',
      ref_type: 'tag',
      master_branch: 'master',
      description: 'Test Repo 1 - For testing github webhooks',
      pusher_type: 'user',
      repository: {
        id: 48804377,
        name: 'test-repo1',
        full_name: 'pablodcar-test/test-repo1',
        private: false,
        description: 'Test Repo 1 - For testing github webhooks',
        fork: false,
        url: 'https://api.github.com/repos/pablodcar-test/test-repo1',
        commits_url: 'https://api.github.com/repos/pablodcar-test/test-repo1/commits{/sha}',
        git_commits_url: 'https://api.github.com/repos/pablodcar-test/test-repo1/git/commits{/sha}',
        issues_url: 'https://api.github.com/repos/pablodcar-test/test-repo1/issues{/number}',
        releases_url: 'https://api.github.com/repos/pablodcar-test/test-repo1/releases{/id}',
        created_at: '2015-12-30T14:33:03Z',
        updated_at: '2015-12-30T14:33:03Z',
        pushed_at: '2015-12-30T14:42:25Z',
        git_url: 'git://github.com/pablodcar-test/test-repo1.git',
        ssh_url: 'git@github.com:pablodcar-test/test-repo1.git',
        default_branch: 'master'
      },
      organization: {
        login: 'pablodcar-test',
        id: 16470569,
        url: 'https://api.github.com/orgs/pablodcar-test',
        repos_url: 'https://api.github.com/orgs/pablodcar-test/repos',
        description: null
      },
      sender: {
        login: 'pablodcar',
        id: 7429473,
        type: 'User',
        site_admin: false
      }
    };
  }

  function githubMock(repoFullNamePackageJsonMap) {

    return {
      getPackageJson: function getPackageJson(rawRepoData) {
        function packageJsonMock() {
          var packageJson = repoFullNamePackageJsonMap[rawRepoData.full_name];
          return !!packageJson ? JSON.stringify(packageJson) : null;
        }
        return Q.fcall(packageJsonMock);
      },
      getRepos: function() {
        return Q.fcall(getRepos);
      }
    };

  }

  function getRepos() {

    return [{
      'id': 48804377,
      'name': 'test-repo1',
      'full_name': 'pablodcar-test/test-repo1',
      'owner': {
        'login': 'pablodcar-test',
        'id': 16470569,
        'url': 'https://api.github.com/users/pablodcar-test',
        'organizations_url': 'https://api.github.com/users/pablodcar-test/orgs',
        'repos_url': 'https://api.github.com/users/pablodcar-test/repos',
        'type': 'Organization',
        'site_admin': false
      },
      'private': false,
      'description': 'Test Repo 1 - For testing github webhooks',
      'fork': false,
      'url': 'https://api.github.com/repos/pablodcar-test/test-repo1',
      'contents_url': 'https://api.github.com/repos/pablodcar-test/test-repo1/contents/{+path}',
      'compare_url': 'https://api.github.com/repos/pablodcar-test/test-repo1/compare/{base}...{head}',
      'issues_url': 'https://api.github.com/repos/pablodcar-test/test-repo1/issues{/number}',
      'pulls_url': 'https://api.github.com/repos/pablodcar-test/test-repo1/pulls{/number}',
      'releases_url': 'https://api.github.com/repos/pablodcar-test/test-repo1/releases{/id}',
      'created_at': '2015-12-30T14:33:03Z',
      'updated_at': '2015-12-30T14:33:03Z',
      'pushed_at': '2015-12-30T14:42:25Z',
      'git_url': 'git://github.com/pablodcar-test/test-repo1.git',
      'default_branch': 'master',
      'permissions': {
        'admin': true,
        'push': true,
        'pull': true
      }
    }, {
      'id': 48804378,
      'name': 'test-repo2',
      'full_name': 'pablodcar-test/test-repo2',
      'owner': {
        'login': 'pablodcar-test',
        'id': 16470569,
        'url': 'https://api.github.com/users/pablodcar-test',
        'organizations_url': 'https://api.github.com/users/pablodcar-test/orgs',
        'repos_url': 'https://api.github.com/users/pablodcar-test/repos',
        'type': 'Organization',
        'site_admin': false
      },
      'private': false,
      'description': 'Test Repo 2 - For testing github webhooks',
      'fork': false,
      'url': 'https://api.github.com/repos/pablodcar-test/test-repo2',
      'contents_url': 'https://api.github.com/repos/pablodcar-test/test-repo2/contents/{+path}',
      'compare_url': 'https://api.github.com/repos/pablodcar-test/test-repo2/compare/{base}...{head}',
      'issues_url': 'https://api.github.com/repos/pablodcar-test/test-repo2/issues{/number}',
      'pulls_url': 'https://api.github.com/repos/pablodcar-test/test-repo2/pulls{/number}',
      'releases_url': 'https://api.github.com/repos/pablodcar-test/test-repo2/releases{/id}',
      'created_at': '2015-12-30T14:33:03Z',
      'updated_at': '2015-12-30T14:33:03Z',
      'pushed_at': '2015-12-30T14:42:25Z',
      'git_url': 'git://github.com/pablodcar-test/test-repo2.git',
      'default_branch': 'master',
      'permissions': {
        'admin': true,
        'push': true,
        'pull': true
      }
    }, {
      'id': 48804379,
      'name': 'test-repo3',
      'full_name': 'pablodcar-test/test-repo3',
      'owner': {
        'login': 'pablodcar-test',
        'id': 16470569,
        'url': 'https://api.github.com/users/pablodcar-test',
        'organizations_url': 'https://api.github.com/users/pablodcar-test/orgs',
        'repos_url': 'https://api.github.com/users/pablodcar-test/repos',
        'type': 'Organization',
        'site_admin': false
      },
      'private': false,
      'description': 'Test Repo 3 - For testing github webhooks',
      'fork': false,
      'url': 'https://api.github.com/repos/pablodcar-test/test-repo3',
      'contents_url': 'https://api.github.com/repos/pablodcar-test/test-repo3/contents/{+path}',
      'compare_url': 'https://api.github.com/repos/pablodcar-test/test-repo3/compare/{base}...{head}',
      'issues_url': 'https://api.github.com/repos/pablodcar-test/test-repo3/issues{/number}',
      'pulls_url': 'https://api.github.com/repos/pablodcar-test/test-repo3/pulls{/number}',
      'releases_url': 'https://api.github.com/repos/pablodcar-test/test-repo3/releases{/id}',
      'created_at': '2015-12-30T14:33:03Z',
      'updated_at': '2015-12-30T14:33:03Z',
      'pushed_at': '2015-12-30T14:42:25Z',
      'git_url': 'git://github.com/pablodcar-test/test-repo3.git',
      'default_branch': 'master',
      'permissions': {
        'admin': true,
        'push': true,
        'pull': true
      }
    }];
  }

  function getPackageJsonWithDependency() {
    return {
      name: 'test-lib2',
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {
        test: 'echo \"Error: no test specified\" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'ISC',
      dependencies: {
        'test-repo1': 'git://github.com/pablodcar-test/test-repo1#0.0.1'
      }
    };
  }

});