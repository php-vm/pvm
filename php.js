const { execSync } = require("child_process");

/**
 * Get currently active PHP version number
 *
 * @return {string}
 */
const current = () =>
    execSync('php -v | head -n 1 | cut -d " " -f 2 | cut -f1-2 -d"."')
        .toString()
        .trim();

/**
 * Get all installed PHP version numbers
 *
 * @return {Array.string}
 */
const installed_versions = () =>
    execSync("find /usr/bin -name 'php*.*' -type f | cut -b 13- | sort -g")
        .toString()
        .trim()
        .split("\n");

/**
 * Get all available PHP version numbers
 *
 * @return {Array.string}
 */
const available_versions = () =>
    execSync("apt-cache search --names-only '^php[0-9]+(.[0-9]+)$' | awk '{print $1}'")
        .toString()
        .trim()
        .split("\n")
        .filter(module => module.startsWith('php'))
        .map(module => module.replace('php', ''));

/**
 * Get all available PHP modules for a specified version
 *
 * @return {Array.string}
 */
const modules = version =>
    execSync(`apt-cache search --names-only '^php${version}-' | awk '{print $1}'`)
        .toString()
        .trim()
        .split("\n")
        .filter(module => module.startsWith('php'))
        .map(module => module.split('-').slice(1).join('-'));

/**
 * Add php version repository
 *
 * @return {Array.string}
 */
const setup = () => {
  console.log('Adding ondrej/php repository...');
  execSync(`sudo add-apt-repository ppa:ondrej/php -y && sudo apt-get update`);
  console.log('Successfully added ondrej/php repository.')
}

/**
 * Switch default PHP Version
 *
 * @param {string} version PHP Version number
 *
 * @return {bool|string}
 */
const use = version => {
  if (!installed_versions().includes(version)) {
    throw new Error(`Invalid version number "${version}"`);
  }

  if (version === current()) {
    return false;
  }

  execSync(
      `sudo /usr/bin/update-alternatives --set php /usr/bin/php${version}`
  );

  return current();
};

/**
 * Install a PHP Version
 *
 * @param {string} version PHP Version number
 * @param {array} modules PHP modules
 * @param {bool} installRecommends Install recommended packages
 *
 * @return {bool|string}
 */
const install = (version, modules, installRecommends) => {
  if (!available_versions().includes(version)) {
    throw new Error(`Invalid version number "${version}"`);
  }

  let packages = [
    `php${version}`,
    ...modules.map(module => `php${version}-${module.replace(/\s/g,'').replace(/[^0-9A-Za-z.-_]/g, '')}`)
  ];

  console.log(`Installing php${version}...`);

  execSync(
      `sudo apt-get ${installRecommends ? '' : '--no-install-recommends'} install ${packages.join(' ')} -y`
  );

  console.log(`Successfully installed php${version}!`);

  return current();
};

/**
 * Get the status of a PHP module
 *
 * @param {string} version PHP Version
 * @param {string} sapi    SAPI name (cli or fpm)
 * @param {string} module  PHP Module name
 *
 * @return {boolean}
 */
const moduleStatus = (version, sapi, module) => {
  try {
    execSync(`phpquery -v ${version} -s ${sapi} -m ${module}`);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Enable PHP Module
 *
 * @param {string} module
 * @param {string|undefined} sapi
 */
const moduleEnable = (module, sapi) => {
  sapi = sapi ? `-s ${sapi}` : "";
  execSync(`sudo /usr/sbin/phpenmod ${sapi} ${module}`);
};

/**
 * Disable PHP Module
 *
 * @param {string} module
 * @param {string|undefined} sapi
 */
const moduleDisable = (module, sapi) => {
  sapi = sapi ? `-s ${sapi}` : "";
  execSync(`sudo /usr/sbin/phpdismod ${sapi} ${module}`);
};

const moduleToggle = (module, sapi) => {
  const currentVersion = current();

  let cliStatus;
  let fpmStatus;

  if (sapi === "cli" || sapi === undefined) {
    cliStatus = moduleStatus(currentVersion, "cli", module);
  }

  if (sapi === "fpm" || sapi === undefined) {
    fpmStatus = moduleStatus(currentVersion, "fpm", module);
  }

  if (cliStatus === true || fpmStatus === true) {
    moduleDisable(module, sapi);
    return false;
  } else {
    moduleEnable(module, sapi);
    return true;
  }
};

module.exports = {
  setup,
  current,
  installed_versions,
  available_versions,
  modules,
  use,
  install,
  moduleStatus,
  moduleEnable,
  moduleDisable,
  moduleToggle
};
