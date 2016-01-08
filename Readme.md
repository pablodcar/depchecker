
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

1. Build the webtask using webpack. A dist/depchecker.js file will be created.
2. Deploy the webtask with a GitHub personal token as secret in the variable GITHUB_TOKEN, e.g. using `wt`: ```$ wt create --secret GITHUB_TOKEN=b688265ee6985408646507f1f4bb5663bb3243d4 dist/depchecker.js```
3. Configure a webhook pointing to the webtask, and only check the *Create* event.

You are done, when a tag is created, the webtask receives the event, traverse all repos in the organization and creates automatic Pull Requests if the github dependendency in package.json is found.

## Running test cases

```
$ mocha
```

## Comming Soon

- Included. ~~Send automated Pull Requests~~
- Support for other formats for GitHub URLs.
- Included. ~~[Webtask](https://webtask.io/) to configure as a Github hook~~
- Use of [semver](http://semver.org/) to detect when a repository is out-of-date.
- Build and deploy of the webtask using Gulp.
