-- Start transaction
BEGIN;

-- Backup existing tables
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE images_backup AS SELECT * FROM images;
CREATE TABLE credit_transactions_backup AS SELECT * FROM credit_transactions;
CREATE TABLE credit_balances_backup AS SELECT * FROM credit_balances;
CREATE TABLE user_rewards_backup AS SELECT * FROM user_rewards;
CREATE TABLE challenge_progress_backup AS SELECT * FROM challenge_progress;
CREATE TABLE trading_cards_backup AS SELECT * FROM trading_cards;
CREATE TABLE card_templates_backup AS SELECT * FROM card_templates;

-- Drop existing foreign key constraints
ALTER TABLE images DROP CONSTRAINT IF EXISTS images_user_id_fkey;
ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
ALTER TABLE credit_balances DROP CONSTRAINT IF EXISTS credit_balances_user_id_fkey;
ALTER TABLE user_rewards DROP CONSTRAINT IF EXISTS user_rewards_user_id_fkey;
ALTER TABLE challenge_progress DROP CONSTRAINT IF EXISTS challenge_progress_user_id_fkey;
ALTER TABLE trading_cards DROP CONSTRAINT IF EXISTS trading_cards_user_id_fkey;
ALTER TABLE card_templates DROP CONSTRAINT IF EXISTS card_templates_creator_id_fkey;

-- Modify users table for Firebase UIDs
ALTER TABLE users
  ALTER COLUMN id TYPE text,
  ALTER COLUMN id SET DEFAULT NULL,
  DROP CONSTRAINT IF EXISTS users_pkey CASCADE;

ALTER TABLE users ADD PRIMARY KEY (id);

-- Modify related tables to use text for user_id
ALTER TABLE images ALTER COLUMN user_id TYPE text;
ALTER TABLE credit_transactions ALTER COLUMN user_id TYPE text;
ALTER TABLE credit_balances ALTER COLUMN user_id TYPE text;
ALTER TABLE user_rewards ALTER COLUMN user_id TYPE text;
ALTER TABLE challenge_progress ALTER COLUMN user_id TYPE text;
ALTER TABLE trading_cards ALTER COLUMN user_id TYPE text;
ALTER TABLE card_templates ALTER COLUMN creator_id TYPE text;

-- Restore foreign key constraints
ALTER TABLE images ADD CONSTRAINT images_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE credit_balances ADD CONSTRAINT credit_balances_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_rewards ADD CONSTRAINT user_rewards_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE challenge_progress ADD CONSTRAINT challenge_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE trading_cards ADD CONSTRAINT trading_cards_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE card_templates ADD CONSTRAINT card_templates_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT;
