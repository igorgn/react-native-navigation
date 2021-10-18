/* tslint:disable: no-console */
const exec = require('shell-utils').exec;
const semver = require('semver');
const fs = require('fs');
const cp = require('child_process');
const includes = require('lodash/includes');
const documentation = require('./documentation');

const packageJsonPath = `${process.cwd()}/package.json`;

// Export buildkite variables for Release build
let isRelease, VERSION, BUILD_DOCUMENTATION_VERSION, REMOVE_DOCUMENTATION_VERSION;
if (process.env.BUILDKITE_MESSAGE.match(/^release$/i)) {
  isRelease = cp.execSync(`buildkite-agent meta-data get release-build`);
  VERSION = cp.execSync(`buildkite-agent meta-data get version`);
  BUILD_DOCUMENTATION_VERSION = cp.execSync(`buildkite-agent meta-data get build-documentation-version`);
  REMOVE_DOCUMENTATION_VERSION = cp.execSync(`buildkite-agent meta-data get remove-documentation-version`);
}

// Workaround JS
const t = typeof (isRelease);
console.log(`Release_build is + ${isRelease}; Type is ${t}`);
console.log(`String check: ${isRelease.toString() === 'true'}; 
             Boolean check: ${isRelease === true}; 
             Another check: ${isRelease ? "TRUE" : "FALSE"}`);
console.log("VERSION is " + VERSION);
console.log("BUILD_DOCUMENTATION_VERSION is " + BUILD_DOCUMENTATION_VERSION);
console.log("REMOVE_DOCUMENTATION_VERSION is " + REMOVE_DOCUMENTATION_VERSION);

const BRANCH = process.env.BUILDKITE_BRANCH;
console.log(BRANCH);
const VERSION_TAG = isRelease ? 'latest' : 'snapshot';
console.log("pre " + VERSION_TAG);
const VERSION_INC = 'patch';
console.log("post " + VERSION_TAG);
function run() {
  if (!validateEnv()) {
    return;
  }
  setupGit();
  createNpmRc();
  versionTagAndPublish();
}

function validateEnv() {
  if (!process.env.CI) {
    throw new Error(`releasing is only available from CI`);
  }
  return true;
}

function setupGit() {
  exec.execSyncSilent(`git config --global push.default simple`);
  exec.execSyncSilent(`git config --global user.email "${process.env.GIT_EMAIL}"`);
  exec.execSyncSilent(`git config --global user.name "${process.env.GIT_USER}"`);
  const remoteUrl = new RegExp(`https?://(\\S+)`).exec(exec.execSyncRead(`git remote -v`))[1];
  exec.execSyncSilent(
    `git remote add deploy "https://${process.env.GIT_USER}:${process.env.GIT_TOKEN}@${remoteUrl}"`
  );
  // exec.execSync(`git checkout ${ONLY_ON_BRANCH}`);
}

function createNpmRc() {
  exec.execSync(`rm -f package-lock.json`);
  const content = `
email=\${NPM_EMAIL}
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
`;
  fs.writeFileSync(`.npmrc`, content);
}

function versionTagAndPublish() {
  const packageVersion = semver.clean(process.env.npm_package_version);
  console.log(`package version: ${packageVersion}`);

  const currentPublished = findCurrentPublishedVersion();
  console.log(`current published version: ${currentPublished}`);

  const version = isRelease
    ? VERSION
    : semver.gt(packageVersion, currentPublished)
      ? `${packageVersion}-snapshot.${process.env.BUILDKITE_BUILD_NUMBER}`
      : `${currentPublished}-snapshot.${process.env.BUILDKITE_BUILD_NUMBER}`;

  console.log(`Publishing version: ${version}`);

  tryPublishAndTag(version);
}

function findCurrentPublishedVersion() {
  return exec.execSyncRead(`npm view ${process.env.npm_package_name} dist-tags.latest`);
}

function tryPublishAndTag(version) {
  let theCandidate = version;
  for (let retry = 0; retry < 5; retry++) {
    try {
      tagAndPublish(theCandidate);
      console.log(`Released ${theCandidate}`);
      return;
    } catch (err) {
      const alreadyPublished = includes(
        err.toString(),
        'You cannot publish over the previously published version'
      );
      if (!alreadyPublished) {
        throw err;
      }
      console.log(`previously published. retrying with increased ${VERSION_INC}...`);
      theCandidate = semver.inc(theCandidate, VERSION_INC);
    }
  }
}

function tagAndPublish(newVersion) {
  console.log(`trying to publish ${newVersion}...`);
  if (BUILD_DOCUMENTATION_VERSION && BUILD_DOCUMENTATION_VERSION !== '')
    documentation.release(BUILD_DOCUMENTATION_VERSION, REMOVE_DOCUMENTATION_VERSION);
  //   exec.execSync(`npm --no-git-tag-version version ${newVersion}`);
  //   exec.execSync(`npm publish --tag ${VERSION_TAG}`);
  if (isRelease) {
    //     exec.execSync(`git tag -a ${newVersion} -m "${newVersion}"`);
    //     exec.execSyncSilent(`git push deploy ${newVersion} || true`);
    //     updatePackageJsonGit(newVersion);
  }
}

function writePackageJson(packageJson) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function readPackageJson() {
  return JSON.parse(fs.readFileSync(packageJsonPath));
}

function updatePackageJsonGit(version) {
  exec.execSync(`git checkout ${BRANCH}`);
  const packageJson = readPackageJson();
  packageJson.version = version;
  writePackageJson(packageJson);
  exec.execSync(`git add package.json`);
  exec.execSync(`git commit -m"Update package.json version to ${version} [ci skip]"`);
  //   exec.execSync(`git push deploy ${BRANCH}`);
  //   draftGitRelease(version);
}

function draftGitRelease(version) {
  exec.execSync(`npx gren release --tags=${version}`);
  exec.execSync(`sleep 1m`);
  // For some unknown reason, gren release works well only when calling it twice.
  exec.execSync(`npx gren release --tags=${version}`);
}

run();
