const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
require('dotenv').config()

Sentry.init({
    dsn: process.env.SENTRY_DNS,
    integrations: [nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
})

