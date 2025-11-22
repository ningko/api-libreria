// valida existencia de FKs

import { db } from '../db.js';

export function validateFK(field, table, column) {
  return async (req, res, next) => {
    const val = req.body[field];

    // check si val es null
    if (val === null) return next();
    // check si val es int
    if (!Number.isInteger(val)) {
      return res.status(400).json({
        error: `${field} debe ser int o null`,
      });
    }
    // check existencia en tabla
    try {
      const [rows] = await db.execute(
        `SELECT ${column} FROM ${table} WHERE ${column} = ?`,
        [val]);

      if (rows.length === 0) {
        return res.status(400).json({ error: `La FK ${field}=${val} no existe en la tabla ${table}` });
      } next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "error validando FK" });
    }
  };
}
