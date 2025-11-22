import express from 'express';
import { db } from '../db.js';
import { normalizeNullableInt } from '../middleware/normalizeNullableInt.js';
import { validateFK } from '../middleware/validateFK.js';

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM ventas`);
        res.json({ ventas: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(req.params.id)) return res.status(400).json({ error: "ID inválido" });

        const [rows] = await db.execute(`SELECT * FROM ventas WHERE id_venta=?`, [id]);
        res.json({ ventas: rows[0] ?? null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.post("/", normalizeNullableInt("id_cliente"), validateFK("id_cliente", "clientes", "id_cliente"), 
async (req, res) => {
    try {
    const { fecha_venta, total_venta, id_cliente } = req.body;
    const total = total_venta ? Number(total_venta) : 0;
    if (isNaN(total) || total < 0) return res.status(400).json({ error: "total_venta: número inválido" });

    const [result] = await db.execute(`INSERT INTO ventas (fecha_venta, total_venta, id_cliente), VALUES (?,?,?)`, [fecha_venta || null, total, id_cliente]);
    res.status(201).json({ venta: { id: result.insertId, fecha_venta: fecha_venta || null, total_venta: total, id_cliente }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.put("/:id", normalizeNullableInt("id_cliente"), validateFK("id_cliente", "clientes", "id_cliente"), 
async (req, res) => {
    try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

    const { fecha_venta, total_venta, id_cliente } = req.body;
    const total = total_venta ? Number(total_venta) : 0;
    if (isNaN(total) || total < 0) return res.status(400).json({ error: "total_venta: número inválido" });

    await db.execute(`UPDATE ventas SET fecha_venta=?, total_venta=?, id_cliente=? WHERE id_venta=?`, [fecha_venta || null, total, id_cliente]);
    res.json({ venta: { id, fecha_venta: fecha_venta || null, total_venta: total, id_cliente }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

        await db.execute(`DELETE FROM ventas WHERE id_venta=?`, [id]);
        res.json({ message: `Venta con ID ${id} eliminada` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

export default router;