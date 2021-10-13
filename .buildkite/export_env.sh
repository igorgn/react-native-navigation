export BRANCH=$BUILDKITE_BRANCH
echo $BRANCH
export VERSION=$(buildkite-agent meta-data get version)
echo $VERSION
export NPM_TAG=$(buildkite-agent meta-data get npm-tag)
echo $NPM_TAG
export BUILD_DOCUMENTATION_VERSION=$(buildkite-agent meta-data get build-documentation-version)
echo $BUILD_DOCUMENTATION_VERSION
export REMOVE_DOCUMENTATION_VERSION=$(buildkite-agent meta-data get remove-documentation-version)
echo $REMOVE_DOCUMENTATION_VERSION
