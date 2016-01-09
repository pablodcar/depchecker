'use strict';

var assert = require('assert');
var _ = require('lodash');
var mocks = require('./mocks.js');

describe('SemVerService', function() {

  var getDepchecker = mocks.getDepchecker;
  var getEvent = mocks.getEvent;
  var getDependency = mocks.getDependency;

  describe('Semantic Version Spec rules when a dependency is precendent or not', function() {

    it('Semantic Version rules when a version is not precendent of other', function() {

      var newTagAndRequired = [
        ['', '1.1.1'],
        ['1.2.A', '1.1.1'],
        ['1.2', '1.1.1'],
        ['1.2.3.4', '1.1.1'],
        ['1.1.1', '1.1.1'],
        ['1.1.0', '1.1.1'],
        ['1.0.1', '1.1.1'],
        ['0.10.1', '1.9.0'],
        ['1.1.1-rc1', '1.1.1'],
        ['1.1.1+2016', '1.1.1'],
        ['1.1.1', '1.2.1.1'],
        ['1.1.1', '1.1.1+123']
      ];

      var total = newTagAndRequired.length;
      var tested = 0;
      var depChecker = getDepchecker();

      _.each(newTagAndRequired, function(tagAndRequired) {
        var tagCreated = tagAndRequired[0];
        var tagDependency = tagAndRequired[1];
        var dependant = getDependency(tagDependency);

        var event = getEvent({
          ref: tagCreated
        });
        var tagUpdated = depChecker.tagUpdated(event);

        assert(!tagUpdated.mustReplaceDependency(dependant),
          'Version "' + tagDependency + '" is not precendent of "' + tagCreated + '"');
        tested++;
      });

      assert.equal(total, tested);

    });

    it('Semantic Version rules when a version is precendent of other', function() {

      var newTagAndRequired = [
        ['1.1.2', '1.1.1'],
        ['1.2.1', '1.1.1'],
        ['2.0.0', '1.1.1'],
        ['1.1.1', '1.1.1-rc1']
      ];

      var total = newTagAndRequired.length;
      var tested = 0;
      var depChecker = getDepchecker();

      _.each(newTagAndRequired, function(tagAndRequired) {
        var tagCreated = tagAndRequired[0];
        var tagDependency = tagAndRequired[1];
        var dependant = getDependency(tagDependency);

        var event = getEvent({
          ref: tagCreated
        });
        var tagUpdated = depChecker.tagUpdated(event);

        assert(tagUpdated.mustReplaceDependency(dependant),
          'Version "' + dependant + '" is precendent of "' + tagCreated + '"');
        tested++;
      });

      assert.equal(total, tested);

    });

  });

});