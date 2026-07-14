import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

// Note: Primary database is Supabase PostgreSQL (see api/services/supabase.ts)
// This Drizzle schema is for the framework's built-in MySQL connection.
// The actual data operations use Supabase client directly.
