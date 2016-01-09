'use strict';

var depchecker = require('../lib/dep-checker.js');
var Q = require('q');

module.exports = {
  getDepchecker: getDepchecker,
  getEvent: getEvent,
  getRepos: getRepos,
  githubMock: githubMock,
  getPackageJsonWithDependency: getPackageJsonWithDependency,
  getDependency: getDependency
};

function getDepchecker(packageJsonMap) {
  if (packageJsonMap) {
    return depchecker({
      gitHubApi: githubMock({
        packageJsonMap: packageJsonMap,
        organization: 'pablodcar-test'
      })
    });
  } else {
    return depchecker({
      gitHubApi: githubMock({})
    });
  }
}

function getEvent(options) {
  var opts = options || {};
  return {
    ref: opts.ref || '0.0.2',
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

function githubMock(options) {

  var repoFullNamePackageJsonMap = options.packageJsonMap;
  var organization = options.organization;

  return {
    getPackageJson: function getPackageJson(rawRepoData) {
      function packageJsonMock() {
        var packageJson = repoFullNamePackageJsonMap[rawRepoData.full_name];
        return !!packageJson ? JSON.stringify(packageJson) : null;
      }
      return Q.fcall(packageJsonMock);
    },
    getRepos: function getRepos() {
      return Q.fcall(getRepos);
    },
    getHeadMasterReference: function getHeadMasterReference(repo) {
      return {
        ref: 'refs/heads/master',
        url: 'https://api.github.com/repos/' + organization + '/' + repo.name + '/git/refs/heads/master',
        object: {
          sha: 'f2c8d807ef34d64afc15ce95ef8f8d4c53c48120',
          type: 'commit',
          url: 'https://api.github.com/repos/' + organization + '/' + repo.name + '/git/commits/f2c8d807ef34d64afc15ce95ef8f8d4c53c48120'
        },
        meta: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4894',
          'x-ratelimit-reset': '1451967401',
          'last-modified': 'Wed, 30 Dec 2015 14:33:03 GMT',
          etag: '"21a785448fe668a657b8a3d5d474ae60"',
          status: '200 OK'
        }
      };
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

function getDependency(tag) {
  if (!!tag) {
    return 'git://github.com/pablodcar-test/test-repo1#' + tag;
  } else {
    return 'git://github.com/pablodcar-test/test-repo1';
  }
}