// toma id_autoer / id_cliente etc y lo transforma automáticamente en null o en un int válido

export function normalizeNullableInt(fieldName) {
    return (req, res, next) => {
        const value = req.body[fieldName];
        if (value === undefined || value === null || value === "") {
            req.body[fieldName] = null;
            return next();
        }
        const num = Number(value);
        if (!Number.isInteger(num)) {
            req.body[fieldName] = null;
            return next();
        }
        req.body[fieldName] = num;
        next();
    };
}