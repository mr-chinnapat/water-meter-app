import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://root:5ZoPWmFtFXDFroYh@94.74.115.204:5432/ocr_service",
});

//const pool = new Pool({
//  connectionString: "postgresql://misterchin:bmw1655@127.0.0.1:5432/so_db",
//});

export async function query(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO pwamapview');
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}
