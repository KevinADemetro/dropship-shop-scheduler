process.env.NODE_ENV = 'test';
process.env.API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3999';
process.env.AUTH_EMAIL = process.env.AUTH_EMAIL ?? 'scheduler@example.com';
process.env.AUTH_PASSWORD = process.env.AUTH_PASSWORD ?? 'test-password';
process.env.AUTH_COUNTRY_CODE = process.env.AUTH_COUNTRY_CODE ?? 'us';
process.env.MERCHANT_CODE = process.env.MERCHANT_CODE ?? 'Incycle';
process.env.SCHEDULER_ENABLED = process.env.SCHEDULER_ENABLED ?? 'false';
