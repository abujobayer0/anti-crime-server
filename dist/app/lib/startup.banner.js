"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerBanner = void 0;
class ServerBanner {
    /**
     * Create a new ServerBanner instance
     * @param logger - Logger instance
     * @param appName - Application name
     * @param version - Application version
     * @param environment - Current environment (development, production, etc.)
     */
    constructor(logger, appName, version, environment) {
        this.logger = logger;
        this.appName = appName;
        this.version = version;
        this.environment = environment;
    }
    /**
     * Display the application banner
     * @param port - Server port number
     */
    displayBanner(port) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [chalkModule, figletModule, boxenModule] = yield Promise.all([
                    Promise.resolve().then(() => __importStar(require("chalk"))),
                    Promise.resolve().then(() => __importStar(require("figlet"))),
                    Promise.resolve().then(() => __importStar(require("boxen"))),
                ]);
                const chalk = chalkModule.default;
                const figlet = figletModule.default;
                const boxen = boxenModule.default;
                const asciiArt = figlet.textSync("ANTI-CRIME", {
                    font: "ANSI Shadow",
                    horizontalLayout: "fitted",
                    verticalLayout: "default",
                });
                const coloredAsciiArt = this.environment === "production"
                    ? chalk.redBright(asciiArt)
                    : chalk.blueBright(asciiArt);
                const serverInfo = [
                    `${chalk.bold("Server")}     : ${this.appName}`,
                    `${chalk.bold("Version")}    : ${chalk.greenBright(this.version)}`,
                    `${chalk.bold("Environment")}: ${this.getEnvironmentBadge(chalk)}`,
                    `${chalk.bold("Port")}       : ${chalk.yellowBright(port.toString())}`,
                    `${chalk.bold("Time")}       : ${chalk.gray(new Date().toLocaleString())}`,
                ].join("\n");
                const securityInfo = [
                    `${chalk.bold("Security Mode")}: ${chalk.redBright("⚠️ ACTIVE")}`,
                    `${chalk.bold("Monitoring")}   : ${chalk.greenBright("✓ ENABLED")}`,
                    `${chalk.bold("Analytics")}    : ${chalk.greenBright("✓ ENABLED")}`,
                ].join("\n");
                const banner = [
                    coloredAsciiArt,
                    chalk.bold(chalk.white("=".repeat(70))),
                    serverInfo,
                    chalk.bold(chalk.white("-".repeat(70))),
                    securityInfo,
                    chalk.bold(chalk.white("=".repeat(70))),
                    chalk.bold(this.environment === "production"
                        ? chalk.redBright("🔒 PRODUCTION MODE - SECURITY PROTOCOLS ENFORCED")
                        : chalk.yellowBright("⚠️ DEVELOPMENT MODE - SECURITY MONITORING ACTIVE")),
                ].join("\n");
                const boxedBanner = boxen(banner, {
                    padding: 1,
                    margin: 1,
                    borderStyle: "round",
                    borderColor: this.environment === "production" ? "red" : "blue",
                    backgroundColor: "#000",
                });
                console.log(boxedBanner);
            }
            catch (error) {
                this.displaySimpleBanner(port);
            }
        });
    }
    /**
     * Display a simple but impressive banner (fallback if fancy banner fails)
     * @param port - Server port number
     */
    displaySimpleBanner(port) {
        const asciiTitle = `
    ╔═╗╔╗╔╔╦╗╦  ╔═╗╦═╗╦╔╦╗╔═╗
    ╠═╣║║║ ║ ║  ║  ╠╦╝║║║║║╣ 
    ╩ ╩╝╚╝ ╩ ╩═╝╚═╝╩╚═╩╩ ╩╚═╝
    `;
        const width = 60;
        const doubleLine = "═".repeat(width);
        const singleLine = "─".repeat(width);
        const isProd = this.environment.toLowerCase() === "production";
        const envMarker = isProd ? "🔒 SECURE" : "⚠️ DEV";
        const message = `
╔${doubleLine}╗
║${" ".repeat(Math.floor((width - asciiTitle.split("\n")[1].length) / 2))}${asciiTitle.split("\n")[1]}${" ".repeat(Math.ceil((width - asciiTitle.split("\n")[1].length) / 2))}║
║${" ".repeat(Math.floor((width - asciiTitle.split("\n")[2].length) / 2))}${asciiTitle.split("\n")[2]}${" ".repeat(Math.ceil((width - asciiTitle.split("\n")[2].length) / 2))}║
║${" ".repeat(Math.floor((width - asciiTitle.split("\n")[3].length) / 2))}${asciiTitle.split("\n")[3]}${" ".repeat(Math.ceil((width - asciiTitle.split("\n")[3].length) / 2))}║
╠${doubleLine}╣
║ Server Information:${" ".repeat(width - 20)}║
╟${singleLine}╢
║ • Name        : ${this.appName}${" ".repeat(width - 16 - this.appName.length)}║
║ • Version     : ${this.version}${" ".repeat(width - 16 - this.version.length)}║
║ • Environment : ${this.environment.toUpperCase()}${" ".repeat(width - 16 - this.environment.length)}║
║ • Port        : ${port}${" ".repeat(width - 16 - port.toString().length)}║
║ • Started     : ${new Date().toLocaleString()}${" ".repeat(width - 16 - new Date().toLocaleString().length)}║
╠${doubleLine}╣
║ Security Status: ${envMarker}${" ".repeat(width - 18 - envMarker.length)}║
╟${singleLine}╢
║ • Mode      : ${isProd ? "PRODUCTION" : "DEVELOPMENT"}${" ".repeat(width - 14 - (isProd ? 10 : 11))}║
║ • Protocol  : ACTIVE${" ".repeat(width - 20)}║
║ • Analytics : ENABLED${" ".repeat(width - 21)}║
╚${doubleLine}╝
    `;
        console.log(message);
    }
    /**
     * Get a colorized badge for the current environment
     * @returns formatted environment badge
     */
    getEnvironmentBadge(chalk) {
        switch (this.environment.toLowerCase()) {
            case "production":
                return chalk.bgRedBright.black(` ${this.environment.toUpperCase()} `);
            case "staging":
                return chalk.bgYellowBright.black(` ${this.environment.toUpperCase()} `);
            case "testing":
                return chalk.bgCyanBright.black(` ${this.environment.toUpperCase()} `);
            case "development":
            default:
                return chalk.bgBlueBright.black(` ${this.environment.toUpperCase()} `);
        }
    }
}
exports.ServerBanner = ServerBanner;
exports.default = ServerBanner;
