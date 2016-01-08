
# Dependency Checker

Detects out of date NodeJS repostories when a new tag is created in a dependency.

## How it works

- As a command line tool, receiving an organization name `-o`, a dependency `-d` and a tag `-t`

```
$ ./bin/depchecker.js -o [organization] -d git://github.com/user/project.git -t tag -c 'username:password'
```

Where `organization` is the organization name in GitHub, the `dependency` is a Git URL and `tag` is the tag which has to be used, e.g. using semantic versioning, 1.1.0.

`credentials` are the username and password to be used when calling GitHub API.

## Running test cases

```
$ mocha
```

## Comming Soon

- Included. ~~Send automated Pull Requests~~
- Support for other formats for GitHub URLs.
- Included. ~~[Webtask](https://webtask.io/) to configure as a Github hook~~
- Use of [semver](http://semver.org/) to detect when a repository is out-of-date.
