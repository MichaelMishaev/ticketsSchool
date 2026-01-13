-- AlterTable: Add codeVerifier column to OAuthState for PKCE support
ALTER TABLE "OAuthState" ADD COLUMN IF NOT EXISTS "codeVerifier" TEXT;
