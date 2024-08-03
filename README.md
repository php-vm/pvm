# pvm
A simple PHP Version manager.

## Installation

### PNPM
```bash
pnpm i -g pvm
```

### NPM
```bash
npm i -g pvm
```

## Usage
```bash
Options:
  -v, --version                  output the current application version
  -h, --help                     display help for command

Commands:
  status|s                       Show current PHP version status
  setup                          Setup php version manager. Will setup php repository list
  ls [options]                   List PHP available versions and modules
  use|u <version>                Switch PHP version
  install|i [options] <version>  Installs a PHP version or composer
  xdebug|x [sapi] [status]       Manage XDebug status
  restart|r                      Restart PHP-FPM and NGINX
  help [command]                 display help for command
```

Example for updating from PHP 7.4 to PHP 8.2:
```bash
pvm i 8.2
pvm use 8.2
```
