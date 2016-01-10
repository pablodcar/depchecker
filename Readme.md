
# Dependency Checker

Detects out of date NodeJS repostories when a new tag is created in a dependency.

## How it works

### As a command line tool

Receiving an organization name `-o`, a dependency `-d` and a tag `-t`

```
$ ./bin/depchecker.js -o [organization] -d git://github.com/user/project.git -t tag -c 'username:password'
```

Where `organization` is the organization name in GitHub, the `dependency` is a Git URL and `tag` is the tag which has to be used, e.g. using semantic versioning, 1.1.0.

`credentials` are the username and password to be used when calling GitHub API.

### As a [Webtask](https://webtask.io/) 

1. Build the webtask using ```gulp bundle```. A dist/depchecker.js file will be created.
2. Deploy the webtask with a GitHub personal token as secret in the variable GITHUB_TOKEN, e.g. using `wt`: ```$ wt create --secret GITHUB_TOKEN=b688265ee6985408646507f1f4bb5663bb3243d4 dist/depchecker.js```
3. Configure a webhook pointing to the webtask, and only check the *Create* event.

You are done, when a tag is created, the webtask receives the event, traverse all repos in the organization and creates automatic Pull Requests if the github dependendency in package.json is found.

## Running test cases

```
$ mocha
```

## Features

- Send automated Pull Requests
- [Webtask](https://webtask.io/) to configure as a Github hook
- Use of [semver](http://semver.org/) to detect when a repository is out-of-date.

## Comming Soon

- Support for other formats for GitHub URLs.
- Security mechanism to do not leave the webtask open to the world.

