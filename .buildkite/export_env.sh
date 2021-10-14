#!/bin/bash
BK_MSG=$(echo "$BUILDKITE_MESSAGE" | tr '[:upper:]' '[:lower:]')
echo $BK_MSG
if [[ $BK_MSG =~ release ]];then
  export BRANCH=$BUILDKITE_BRANCH
  echo "BRANCH = $BRANCH"
  export RELEASE_BUILD=$(buildkite-agent meta-data get release-build)
  echo "RELEASE_BUILD = $RELEASE_BUILD"
  export VERSION=$(buildkite-agent meta-data get version)
  echo "VERSION = $VERSION"
  export NPM_TAG=$(buildkite-agent meta-data get npm-tag)
  echo "NPM_TAG = $NPM_TAG"
  export BUILD_DOCUMENTATION_VERSION=$(buildkite-agent meta-data get build-documentation-version)
  echo "BUILD_DOCUMENTATION_VERSION = $BUILD_DOCUMENTATION_VERSION"
  export REMOVE_DOCUMENTATION_VERSION=$(buildkite-agent meta-data get remove-documentation-version)
  echo "REMOVE_DOCUMENTATION_VERSION = $REMOVE_DOCUMENTATION_VERSION"
fi
