// Container for all the environments
let environments = {};

// Development (default)
environments.development = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'development',
  hashingSecret: 'my little secret',
  stripeApiKey: 'your_test_key_here',
  stripeApiHostname: 'api.stripe.com',
  mailGunApiKey: 'your_test_key_here',
  mailGunDomainName: 'your_domain_here',
  mailGunApiHostname: 'api.mailgun.net',
  templateGlobals: {
    appName: 'Pizza Luv',
    baseURL: 'http://localhost:3000',
    companyName: 'Home Inc.',
    yearCreated: 2021,
  },
  token: {
    tokenIdLength: 20,
    accessTokenMaxAge: 15 * 60,
    refreshTokenMaxAge: 30 * 60,
  },
  menu:{
    categories: ['pizza', 'drink'],
  },
};

// Production
environments.production = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'production',
  hashingSecret: process.env.NODE_SECRET,
  stripeApiKey: process.env.STRIPE_API_KEY,
  stripeApiHostname: 'api.stripe.com',
  mailGunApiKey: process.env.MAILGUN_API_KEY,
  mailGunDomainName: process.env.MAILGUN_DOMAIN,
  mailGunApiHostname: 'api.mailgun.net',
  templateGlobals: {
    appName: 'Pizza Luv',
    baseURL: 'http://localhost:3000',
    companyName: 'Home Inc.',
    yearCreated: 2021,
  },
  token: {
    tokenIdLength: 20,
    accessTokenMaxAge: 15 * 60,
    refreshTokenMaxAge: 30 * 60,
  },
  menu:{
    categories: ['pizza', 'drink'],
  },
};


// Determine wich environment was passed as a command-line argument if any
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not, default to development
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment]: environments.development;

export default environmentToExport;