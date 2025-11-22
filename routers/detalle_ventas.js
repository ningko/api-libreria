import express from 'express';
import { db } from '../db.js';
import { normalizeNullableInt } from '../middleware/normalizeNullableInt.js';
import { validateFK } from '../middleware/validateFK.js';

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT * FROM detalle_ventas`);
    res.json({ detalles: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

    const [rows] = await db.execute(`SELECT * FROM detalle_ventas WHERE id_detalle=?`, [id]);
    res.json({ detalle: rows[0] ?? null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

router.post(
  "/",
  normalizeNullableInt("id_venta"),
  normalizeNullableInt("id_libro"),
  validateFK("id_venta", "ventas", "id_venta"),
  validateFK("id_libro", "libros", "id_libro"),
  async (req, res) => {
    try {
      const { id_venta, id_libro, cantidad, precio_unitario } = req.body;

      const can = Number(cantidad);
      const precio = Number(precio_unitario);

      if (!Number.isInteger(can) || can <= 0) return res.status(400).json({ error: "Cantidad inválida" });
      if (isNaN(precio) || precio < 0) return res.status(400).json({ error: "Precio inválido" });

      const [result] = await db.execute(
        `INSERT INTO detalle_ventas (id_venta, id_libro, cantidad, precio_unitario) VALUES (?,?,?,?)`,
        [id_venta, id_libro, can, precio]
      );

      res.status(201).json({ detalle: { id: result.insertId, id_venta, id_libro, cantidad: can, precio_unitario: precio } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error de servidor" });
    }
  }
);

router.put(
  "/:id",
  normalizeNullableInt("id_venta"),
  normalizeNullableInt("id_libro"),
  validateFK("id_venta", "ventas", "id_venta"),
  validateFK("id_libro", "libros", "id_libro"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

      const { id_venta, id_libro, cantidad, precio_unitario } = req.body;

      const can = Number(cantidad);
      const precio = Number(precio_unitario);

      if (!Number.isInteger(can) || can <= 0) return res.status(400).json({ error: "Cantidad inválida" });
      if (isNaN(precio) || precio < 0) return res.status(400).json({ error: "Precio inválido" });

      await db.execute(
        `UPDATE detalle_ventas SET id_venta=?, id_libro=?, cantidad=?, precio_unitario=? WHERE id_detalle=?`,
        [id_venta, id_libro, can, precio, id]
      );

      res.json({ detalle: { id, id_venta, id_libro, cantidad: can, precio_unitario: precio } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error de servidor" });
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

    await db.execute(`DELETE FROM detalle_ventas WHERE id_detalle=?`, [id]);
    res.json({ message: `Detalle con ID ${id} eliminado` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
