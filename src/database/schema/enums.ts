// src/database/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['local', 'google']);

export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'premium', 'pro']);

export const acquisitionSourceEnum = pgEnum('acquisition_source', [
  'purchased',
  'gift',
  'propagation',
  'collected',
  'other',
]);
  