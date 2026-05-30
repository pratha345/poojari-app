-- Migration: Add 'abhyasak' role to users.role ENUM
-- Run this once on any existing database
-- Date: 2026-05-22

ALTER TABLE users
  MODIFY COLUMN role
  ENUM('super_admin','admin','pujari','user','abhyasak')
  NOT NULL DEFAULT 'user';
