import { pgEnum } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['local', 'google']);

export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro']);

export const acquisitionSourceEnum = pgEnum('acquisition_source', [
  'nursery',
  'private_seller', 
  'gift',
  'grown_from_seed'
]);