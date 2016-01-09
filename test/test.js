'use strict';

var assert = require('assert');
var _ = require('lodash');
var mocks = require('./mocks.js');

describe('DepChecker', function() {

  var getDepchecker = mocks.getDepchecker;
  var getEvent = mocks.getEvent;
  var getRepos = mocks.getRepos;
  var getPackageJsonWithDependency = mocks.getPackageJsonWithDependency;

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

});