import express from 'express';
import { db } from '../db.js';
import { normalizeNullableInt } from '../middleware/normalizeNullableInt.js';
import { validateFK } from '../middleware/validateFK.js';

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const [libros] = await db.execute(`SELECT * FROM libros`);
        res.json({ libros });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
        const [rows] = await db.execute(`SELECT * FROM libros WHERE id_libro=?`, [id]);
        res.json({ libro: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

router.post("/", normalizeNullableInt("id_autor"), validateFK("id_autor", "autores", "id_autor"), 
    async (req, res) => {
    try {
        const {titulo, genero, precio, stock, id_autor} = req.body;

        if (!titulo) return res.status(400).json({ error: "Título requerido" });
        if (precio === undefined || isNaN(Number(precio)) || Number(precio) <= 0) return res.status(400).json({ error: "Precio debe ser un número positivo" });
        if (stock === undefined || !Number.isInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ error: "Stock debe ser un número positivo o cero" });

        const [result] = await db.execute(`INSERT INTO libros (titulo, genero, precio, stock, id_autor) VALUES (?,?,?,?,?)`, [titulo, genero || null, Number(precio), Number(stock), id_autor]);

        res.status(201).json({libro: { id: result.insertId, titulo, genero: genero || null, precio: Number(precio), stock: Number(stock), id_autor }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" })
    }
});

router.put("/:id", normalizeNullableInt("id_autor"), validateFK("id_autor", "autores", "id_autor"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" })
            const {titulo, genero, precio, stock, id_autor} = req.body;

            if (!titulo) return res.status(400).json({ error: "Título requerido" });
            if (precio === undefined || isNaN(Number(precio)) || Number(precio) <= 0) return res.status(400).json({ error: "Precio debe ser un número positivo" });
            if (stock === undefined || !Number.isInteger(Number(stock)) || Number(stock) < 0) return res.status(400).json({ error: "Stock debe ser un número positivo o cero" });

            await db.execute(`UPDATE libros SET titulo=?, genero=?, precio=?, stock=?, id_autor=? WHERE id_libro=?`, [titulo, genero || null, Number(precio), Number(stock), id_autor, id]);

            res.json({ libro: { id, titulo, genero: genero || null, precio: Number(precio), stock: Number(stock), id_autor }});
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Error de servidor" })
        }
    });

router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });
        
        await db.execute(`DELETE FROM libros WHERE id_libro=?`, [id]);
        res.json({ message: `Libro con ID ${id} eliminado` })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error de servidor" })
    }
});

export default router