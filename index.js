#!/usr/bin/env node

const commander = require("commander");
const chalk = require("chalk");
const php = require("./php");
const fpm = require("./fpm");
const applicationVersion = require("../package.json").version;

if (process.argv.length === 2) {
    process.argv.push("status");
}

const renderStatus = () => {
    console.log(
        chalk`\n  {green PHP Version Manager} version {yellow ${applicationVersion}}\n`
    );

    const version = php.current();
    const cli = php.moduleStatus(version, "cli", "xdebug");
    const fpm = php.moduleStatus(version, "fpm", "xdebug");

    const phpText = "PHP: " + chalk.blue.bold(version);
    const cliText = "CLI: " + (cli ? chalk.green.bold("ON") : chalk.red.bold("OFF"));
    const fpmText = "FPM: " + (fpm ? chalk.green.bold("ON") : chalk.red.bold("OFF"));

    console.log("  " + [phpText, cliText, fpmText].join("   ") + "\n");
};

const program = new commander.Command();

program
    .name("pvm")
    .version(
        applicationVersion,
        "-v, --version",
        "output the current application version"
    )
    .usage("[command] [options]")
    .description(
        chalk`{green PHP Version Manager} version {yellow ${applicationVersion}}`
    );

program
    .command("status")
    .alias("s")
    .description("Show current PHP version status")
    .action(() => {
        renderStatus();

        process.exit(0);
    });

program
    .command("setup")
    .description("Setup php version manager\nWill setup php repository list")
    .action(() => {
        php.setup();

        process.exit(0);
    });

program
    .command("ls")
    .option('-i, --installed', 'List all installed versions', false)
    .option('-v, --version <version>', 'List all modules for given version', null)
    .option('-m, --modules', 'List modules', false)
    .description("List PHP available versions and modules")
    .action((options) => {
        const currentVersion = php.current();
        if(options.version !== null)
            options.version = options.version.replace('php', '');
        (options.installed ? php.installed_versions() : php.available_versions()).forEach(version => {
            if(options.version !== null && options.version !== version)
                return;
            if (version === currentVersion) {
                console.log(chalk.green(version));
            } else {
                console.log(version);
            }
            if(options.modules) {
                console.log(`Module: ${php.modules(version).join(',')}`)
            }
        });

        process.exit(0);
    });

program
    .command("use <version>")
    .alias("u")
    .description("Switch PHP version")
    .action(version => {
        version = version.replace('php', '');

        if (php.use(version)) {
            console.log("Restarting PHP-FPM and NGINX");
            fpm.restart();
        }

        renderStatus();
    });

program
    .command("install <version>")
    .alias("i")
    .option("-ir, --install-recommends", 'Install recommended packages like apache2', false)
    .option("-m, --modules [modules...]", 'List of php modules', [
        "cli",
        "curl",
        "mbstring",
        "xdebug",
        "zip",
        "redis",
        "xml",
        "mysql",
        "gd",
        "common"
    ])
    .description("Installs a PHP version or composer")
    .action((version, options) => {
        if(version === 'composer'){
            php.install_composer();
        }else{
            version = version.replace('php', '');

            if (php.install(version, options.modules, options.installRecommends)) {
                console.log("Restarting PHP-FPM and NGINX");
                fpm.restart();
            }
        }
    });

program
    .command("xdebug [sapi] [status]")
    .alias("x")
    .description("Manage XDebug status")
    .action((sapi, status) => {
        const enableOptions = ["1", "on", "yes", "y"];
        const disableOptions = ["0", "off", "no", "n"];

        if (
            status === undefined &&
            (enableOptions.includes(sapi) || disableOptions.includes(sapi))
        ) {
            status = sapi;
            sapi = undefined;
        }

        if (sapi !== undefined && !["fpm", "cli"].includes(sapi)) {
            throw new Error(`Invalid SAPI \'${sapi}\', specify \'fpm\' or \'cli\'`);
        }

        if (status === undefined) {
            php.moduleToggle("xdebug", sapi);
        } else if (enableOptions.includes(status)) {
            php.moduleEnable("xdebug", sapi);
        } else if (disableOptions.includes(status)) {
            php.moduleDisable("xdebug", sapi);
        } else {
            throw new Error(`Invalid status \'${status}\'`);
        }

        switch (status) {
            case undefined:
                break;
            case "1":
            case "on":
            case "yes":
            case "y":
                php.moduleEnable("xdebug", sapi);
                break;
            case "0":
            case "off":
            case "no":
            case "n":
                php.moduleDisable("xdebug", sapi);
                break;
            default:
                throw new Error(`Invalid status \'${status}\'`);
        }

        if (sapi === "fpm" || sapi === undefined) {
            console.log("Restarting PHP-FPM and NGINX");
            fpm.restart();
        }

        renderStatus();

        process.exit(0);
    });

program
    .command("restart")
    .alias("r")
    .description("Restart PHP-FPM and NGINX")
    .action(() => {
        console.log("Restarting PHP-FPM and NGINX");
        fpm.restart();
        process.exit(0);
    });

program.parse(process.argv);

if (!program.args.length) renderStatus();
