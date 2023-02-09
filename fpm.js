const { execSync } = require("child_process");
const { installed_versions } = require("./php");

/**
 * Restart PHP-FPM and NGINX services
 *
 * @return {boolean}
 */
const restart = () => {
  installed_versions().forEach(version => {
    try{
      execSync(`sudo /usr/sbin/service php${version}-fpm restart`);
    }catch (e){}
  });
  try{
    execSync("sudo /usr/sbin/service nginx restart");
  }catch (e){}
  return true;
};

module.exports = {
  restart
};
