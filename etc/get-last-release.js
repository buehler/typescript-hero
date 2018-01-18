const fetch = require('node-fetch');
const semver = require('semver');
const getPkg = require('read-pkg-up');
const execa = require('execa');
const registry = 'vs code marketplace';

/**
 * Get the commit sha for a given tag.
 *
 * @param {string} tagName Tag name for which to retrieve the commit sha.
 *
 * @return {string} The commit sha of the tag in parameter or `null`.
 */
async function gitTagHead(tagName, logger) {
  try {
    return await execa.stdout('git', ['rev-list', '-1', tagName]);
  } catch (err) {
    logger.error(err);
    return null;
  }
}

/**
 * Unshallow the git repository (retriving every commits and tags).
 */
async function unshallow() {
  await execa('git', ['fetch', '--unshallow', '--tags'], { reject: false });
}

async function getVersionHead(version, logger) {
  let tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));

  // Check if tagHead is found
  if (tagHead) {
    logger.log('Use tagHead: %s', tagHead);
    return tagHead;
  }
  await unshallow();

  // Check if tagHead is found
  tagHead = (await gitTagHead(`v${version}`)) || (await gitTagHead(version));
  if (tagHead) {
    logger.log('Use tagHead: %s', tagHead);
    return tagHead;
  }
}

/**
  References:
  * https://github.com/Microsoft/vscode/blob/master/src/vs/platform/extensionManagement/node/extensionGalleryService.ts#L423
  * https://github.com/Microsoft/vscode/blob/b00945fc8c79f6db74b280ef53eba060ed9a1388/product.json#L17-L21
*/

module.exports = async (_pluginConfig, { logger }) => {
  const { pkg: { name, publisher } } = await getPkg();
  const extensionId = `${publisher}.${name}`;
  logger.log(`Lookup extension details for "${extensionId}".`);
  const body = JSON.stringify({
    filters: [
      {
        pageNumber: 1,
        pageSize: 1,
        criteria: [
          { filterType: 7, value: extensionId }
        ]
      }
    ],
    'assetTypes': [],
    'flags': 512
  });

  const res = await fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
    method: 'POST',
    headers: {
      'Accept': 'application/json;api-version=3.0-preview.1',
      'Content-Type': 'application/json',
      'Content-Length': body.length
    },
    body
  });
  const { results = [] } = await res.json();
  const [{ extensions = [] } = {}] = results;

  const [{ versions = [] }] = extensions.filter(({ extensionName, publisher: { publisherName } }) => {
    return extensionId === `${publisherName}.${extensionName}`;
  });
  const [version] = versions
    .map(({ version }) => version)
    .sort(semver.compare)
    .reverse();

  if (!version) {
    logger.log('No version found of package %s found on %s', extensionId, registry);
    return {};
  }

  logger.log('Found version %s of package %s', version, extensionId);
  return {
    gitHead: await getVersionHead(version, logger),
    version
  };
};
