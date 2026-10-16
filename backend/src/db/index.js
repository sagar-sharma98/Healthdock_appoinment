import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'healthdock_db',
      user: process.env.DB_USER || 'postgres',
      password: String(process.env.DB_PASSWORD || '84@#$Sagar'),
    };

export const pool = new Pool(poolConfig);

export const query = (text, params) => pool.query(text, params);
