import express from 'express';
import { db } from '../db.js';
import { normalizeNullableInt } from '../middleware/normalizeNullableInt.js';
import { validateFK } from '../middleware/validateFK.js';

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM autores`);
        res.json({ autores: rows })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" })
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

        const rows = await db.execute(`SELECT * FROM autores WHERE id_autor=?`, [id]);
        res.json({ autor: rows[0] ?? null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.post("/", async (req, res) => {
  try {
    const { nombre_completo } = req.body;
    if (!nombre_completo) return res.status(400).json({ error: "Nombre requerido" });

    const [result] = await db.execute(`INSERT INTO autores (nombre_completo) VALUES (?)`, [nombre_completo]);

    res.status(201).json({ autor: { id: result.insertId, nombre_completo }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
        const { nombre_completo } = req.body;
        if (!nombre_completo) return res.status(400).json({ error: "Nombre requerido" });
        
        await db.execute(`UPDATE autores SET nombre_completo=? WHERE id_autor=?`, [nombre_completo, id]);

        res.json({ autor: { id, nombre_completo }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

        await db.execute(`DELETE FROM autores WHERE id_autor=?`, [id]);
        res.json({ message: `Autor con ID ${id} eliminado` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

export default router;