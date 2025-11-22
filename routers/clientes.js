import express from 'express';
import { db } from '../db.js'

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM clientes`);
        res.json({ clientes: rows })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
        const [rows] = await db.execute(`SELECT * FROM clientes WHERE id_cliente=?`, [id]);
        res.json({ cliente: rows[0] ?? null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { nombre, email, telefono } = req.body;

        if (!nombre || !email) return res.status(400).json({ error: "Nombre y email requeridos" });
        const [result] = await db.execute(`INSERT INTO clientes (nombre, email, telefono) VALUES (?,?,?)`, [nombre, email, telefono || null]);

        res.status(201).json({ cliente: { id: result.insertId, nombre, email, telefono: telefono || null }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
        const { nombre, email, telefono } = req.body;
        if (!nombre || !email) return res.status(400).json({ error: "Nombre y email requeridos" });

        await db.execute(`UPDATE clientes SET nombre=?, email=?, telefono=? WHERE id_cliente=?`, [nombre, email, telefono || null, id]);
        res.json({ cliente: { id, nombre, email, telefono: telefono || null }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" })
        
        await db.execute(`DELETE FROM clientes WHERE id_cliente=?`, [id]);
        res.json({ message: `Cliente con ID ${id} eliminado `});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

export default router;