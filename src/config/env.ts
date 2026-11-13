import dotenv from 'dotenv';
import cron from 'node-cron';
import { bool, cleanEnv, makeValidator, str, url } from 'envalid';

dotenv.config();

const cronExpr = makeValidator((input: string) => {
  if (!cron.validate(input)) {
    throw new Error(`Invalid cron expression: ${input}`);
  }
  return input;
});

/**
 * Credentials and runtime secrets — never hardcode these in schedule.ts.
 * Copy `.env.example` to `.env` and fill the values for local runs.
 */
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development', choices: ['development', 'test', 'production'] }),
  /** Kong / API gateway base URL used by the web (same as REACT_APP_API_URL). */
  API_BASE_URL: url({ desc: 'API gateway base URL' }),
  AUTH_EMAIL: str({ desc: 'Login email for the automation user' }),
  AUTH_PASSWORD: str({ desc: 'Login password for the automation user' }),
  AUTH_COUNTRY_CODE: str({ default: 'us', desc: 'Country code sent on login' }),
  AUTH_CONSUMER_USERNAME: str({
    default: 'centralizer_website',
    desc: 'Kong consumer username used by the web login flow',
  }),
  MERCHANT_CODE: str({
    default: 'Incycle',
    desc: 'Merchant whose order-split Dropship shop will be toggled',
  }),
  /** IANA timezone used by node-cron for both routines. */
  SCHEDULE_TIMEZONE: str({ default: 'America/Los_Angeles' }),
  /** node-cron expression for deactivating Dropship (isActive=false). */
  DEACTIVATE_CRON: cronExpr({ default: '0 18 * * *' }),
  /** node-cron expression for activating Dropship (isActive=true). */
  ACTIVATE_CRON: cronExpr({ default: '0 23 * * *' }),
  /** When false, main refuses to start (exit 1). Tests set this so importing env does not imply a live scheduler. */
  SCHEDULER_ENABLED: bool({ default: true }),
  LOG_LEVEL: str({ default: 'info', choices: ['debug', 'info', 'warn', 'error'] }),
});

export type Env = typeof env;
