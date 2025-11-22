import express from 'express';
import librosRouter from './routers/libros.js'
import autoresRouter from './routers/autores.js'
import clientesRouter from './routers/clientes.js'
import ventasRouter from './routers/ventas.js'
import detallesRouter from './routers/detalle_ventas.js'

const app = express();
const port = 3000;

app.use(express.json());

app.use("/libros", librosRouter);
app.use("/autores", autoresRouter);
app.use("/clientes", clientesRouter);
app.use("/ventas", ventasRouter);
app.use("/detalle_ventas", detallesRouter);

app.listen(3000, () => {
    console.log(`App funcionando en localhost:${port}`)
})