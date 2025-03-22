import Logger from "../utils/logger";
export class ServerBanner {
  private logger: Logger;
  private appName: string;
  private version: string;
  private environment: string;

  /**
   * Create a new ServerBanner instance
   * @param logger - Logger instance
   * @param appName - Application name
   * @param version - Application version
   * @param environment - Current environment (development, production, etc.)
   */
  constructor(
    logger: Logger,
    appName: string,
    version: string,
    environment: string
  ) {
    this.logger = logger;
    this.appName = appName;
    this.version = version;
    this.environment = environment;
  }

  /**
   * Display the application banner
   * @param port - Server port number
   */
  async displayBanner(port: any): Promise<void> {
    try {
      const [chalkModule, figletModule, boxenModule] = await Promise.all([
        import("chalk"),
        import("figlet"),
        import("boxen"),
      ]);

      const chalk = chalkModule.default;
      const figlet = figletModule.default;
      const boxen = boxenModule.default;

      const asciiArt = figlet.textSync("ANTI-CRIME", {
        font: "ANSI Shadow",
        horizontalLayout: "fitted",
        verticalLayout: "default",
      });

      const coloredAsciiArt =
        this.environment === "production"
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
        chalk.bold(
          this.environment === "production"
            ? chalk.redBright(
                "🔒 PRODUCTION MODE - SECURITY PROTOCOLS ENFORCED"
              )
            : chalk.yellowBright(
                "⚠️ DEVELOPMENT MODE - SECURITY MONITORING ACTIVE"
              )
        ),
      ].join("\n");

      const boxedBanner = boxen(banner, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: this.environment === "production" ? "red" : "blue",
        backgroundColor: "#000",
      });

      console.log(boxedBanner);

      this.logger.info(
        `${this.appName} v${this.version} started on port ${port} (${this.environment})`
      );
    } catch (error) {
      this.logger.warn("Failed to display fancy banner", { error });
      this.displaySimpleBanner(port);
    }
  }

  /**
   * Display a simple but impressive banner (fallback if fancy banner fails)
   * @param port - Server port number
   */
  private displaySimpleBanner(port: number): void {
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

    this.logger.info(
      `${this.appName} v${this.version} started on port ${port} (${this.environment})`
    );
  }

  /**
   * Get a colorized badge for the current environment
   * @returns formatted environment badge
   */
  private getEnvironmentBadge(chalk: any): string {
    switch (this.environment.toLowerCase()) {
      case "production":
        return chalk.bgRedBright.black(` ${this.environment.toUpperCase()} `);
      case "staging":
        return chalk.bgYellowBright.black(
          ` ${this.environment.toUpperCase()} `
        );
      case "testing":
        return chalk.bgCyanBright.black(` ${this.environment.toUpperCase()} `);
      case "development":
      default:
        return chalk.bgBlueBright.black(` ${this.environment.toUpperCase()} `);
    }
  }
}

export default ServerBanner;
