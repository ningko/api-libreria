import { useEffect, useState } from "react";
import "./app.css";

export default function App() {
  const tabs = ["libros", "autores", "clientes", "ventas", "detalles"];
  const api = "http://localhost:3000";

  const responseKeys = {
    libros: "libros",
    autores: "autores",
    clientes: "clientes",
    ventas: "ventas",
    detalles: "detalle_ventas"
  };

  const tabEndpoints = {
    libros: "libros",
    autores: "autores",
    clientes: "clientes",
    ventas: "ventas",
    detalles: "detalle_ventas"
  };

  const idFields = {
    libros: "id_libro",
    autores: "id_autor",
    clientes: "id_cliente",
    ventas: "id_venta",
    detalles: "id_detalle"
  };

  const tableFieldMap = {
    libros: ["titulo", "genero", "precio", "stock", "id_autor"],
    autores: ["nombre_completo"],
    clientes: ["nombre", "email", "telefono"],
    ventas: ["fecha_venta", "total_venta", "id_cliente"],
    detalles: ["id_venta", "id_libro", "cantidad", "precio_unitario"]
  };

  const labelNames = {
    titulo: "Título",
    genero: "Género",
    precio: "Precio",
    stock: "Stock",
    nombre_completo: "Nombre completo",
    nombre: "Nombre",
    email: "Email",
    telefono: "Teléfono",
    fecha_venta: "Fecha de venta",
    total_venta: "Total venta",
    id_cliente: "Cliente",
    id_autor: "Autor",
    id_libro: "Libro",
    id_venta: "Venta",
    cantidad: "Cantidad",
    precio_unitario: "Precio unitario"
  };

  const [tab, setTab] = useState("libros");
  const [data, setData] = useState([]);
  const [fkOptions, setFkOptions] = useState({});
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);

 const fetchData = async (currentTab) => {
  try {
    const endpoint = tabEndpoints[currentTab || tab];
    const url = `${api}/${endpoint}`;
    console.log("[fetchData] llamando a:", url);

    const res = await fetch(url);
    console.log("[fetchData] status:", res.status, "ok:", res.ok);

    // Si status no es ok igual intentamos parsear el body para ver el mensaje
    const json = await res.json().catch((e) => {
      console.error("[fetchData] no pude parsear json:", e);
      return null;
    });
    console.log("[fetchData] json recibido:", json);

    // Tolerancias / fallback: puede venir
    // { detalle_ventas: [...] }  OR { detalles: [...] } OR directamente [...]
    let finalArray = [];
    if (json == null) {
      finalArray = [];
    } else if (Array.isArray(json)) {
      finalArray = json;
    } else if (responseKeys[currentTab || tab] && Array.isArray(json[responseKeys[currentTab || tab]])) {
      finalArray = json[responseKeys[currentTab || tab]];
    } else if (Array.isArray(json.detalle_ventas)) {
      finalArray = json.detalle_ventas;
    } else if (Array.isArray(json.detalles)) {
      finalArray = json.detalles;
    } else if (Array.isArray(json.data)) {
      finalArray = json.data;
    } else {
      // inspeccion rápida: buscar la primera propiedad que sea array
      const arrProp = Object.keys(json).find((k) => Array.isArray(json[k]));
      finalArray = arrProp ? json[arrProp] : [];
    }

    // Normalizar filas de detalle: garantizar id_detalle como PK
    if (endpoint === "detalle_ventas" && finalArray.length > 0) {
      finalArray = finalArray.map((r) => {
        // si viene { id: x } lo convertimos a id_detalle
        if (r.id !== undefined && r.id_detalle === undefined) {
          return { ...r, id_detalle: r.id };
        }
        // si viene id_detalle pero no id_venta/id_libro, lo dejamos
        return r;
      });
    }

    console.log("[fetchData] filas finales:", finalArray.length, finalArray.slice(0,3));
    setData(finalArray);
  } catch (err) {
    console.error("[fetchData] error:", err);
    setData([]);
  }
};

  const fetchFKs = async (currentTab) => {
  try {
    const endpoints = {};
    if (currentTab === "libros") endpoints.id_autor = "autores";
    if (currentTab === "ventas") endpoints.id_cliente = "clientes";
    if (currentTab === "detalles") {
      endpoints.id_venta = "ventas";
      endpoints.id_libro = "libros";
    }

    const newFKS = {};
    for (const fk in endpoints) {
      const ep = endpoints[fk];
      const url = `${api}/${tabEndpoints[ep] || ep}`;
      console.log("[fetchFKs] llamando a:", url);
      const res = await fetch(url);
      const json = await res.json().catch(() => null);
      console.log("[fetchFKs] json", ep, json);

      // fallback: buscar cualquier array en el objeto
      let list = [];
      if (json == null) list = [];
      else if (Array.isArray(json)) list = json;
      else if (responseKeys[ep] && Array.isArray(json[responseKeys[ep]])) list = json[responseKeys[ep]];
      else {
        const arrProp = Object.keys(json).find((k) => Array.isArray(json[k]));
        list = arrProp ? json[arrProp] : [];
      }

      newFKS[fk] = list;
    }

    console.log("[fetchFKs] opciones fk:", newFKS);
    setFkOptions(newFKS);
  } catch (err) {
    console.error("[fetchFKs] error:", err);
    setFkOptions({});
  }
};

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(tab);
    fetchFKs(tab);
    setEditing(null);
    setFormData({});
    setModalOpen(false);
  }, [tab, refresh]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newVal =
      name === "fecha_venta" && value !== "" ? value : value;
    setFormData((prev) => ({ ...prev, [name]: newVal }));
  };

  const openAddModal = () => {
    const baseFields = tableFieldMap[tab] || [];
    const init = {};
    baseFields.forEach((f) => (init[f] = ""));
    setEditing(null);
    setFormData(init);
    fetchFKs(tab);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    const copy = {};
    const sourceFields =
      data.length > 0 ? Object.keys(data[0]) : tableFieldMap[tab] || [];
    sourceFields.forEach((k) => {
      let val = row[k];
      if (k === "fecha_venta" && val) val = val.slice(0, 10);
      if (k.startsWith("id_") && typeof val === "string") {
      const fkList = fkOptions[k] || [];
      const found = fkList.find((o) => {
      const idKey = Object.keys(o).find((kk) => kk.startsWith("id_"));
    return o[idKey] === val || o.titulo === val || o.nombre === val || o.nombre_completo === val;
  });

  if (found) {
    const idKey = Object.keys(found).find((kk) => kk.startsWith("id_"));
    val = found[idKey];
  }
}

copy[k] = val ?? "";
    });
    setEditing(row);
    setFormData(copy);
    fetchFKs(tab);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    const id = row[idFields[tab]];
    await fetch(`${api}/${tabEndpoints[tab]}/${id}`, { method: "DELETE" });
    setRefresh((r) => !r);
  };

  const normalizePayload = (payload) => {
    const out = { ...payload };
    Object.keys(out).forEach((k) => {
      if (out[k] === "") out[k] = null;
      if (
        (k === "precio" ||
          k === "total_venta" ||
          k === "precio_unitario") &&
        out[k] !== null
      )
        out[k] = Number(out[k]);
      if (
        (k === "stock" ||
          k === "cantidad" ||
          k.startsWith("id_")) &&
        out[k] !== null
      ) {
        const n = Number(out[k]);
        out[k] = Number.isNaN(n) ? null : n;
      }
    });
    return out;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const id = editing ? editing[idFields[tab]] : null;
    const url = editing
      ? `${api}/${tabEndpoints[tab]}/${id}`
      : `${api}/${tabEndpoints[tab]}`;
    const payload = normalizePayload(formData);

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setModalOpen(false);
    setRefresh((r) => !r);
  };

  const renderModal = () => {
    if (!modalOpen) return null;

    const sourceFields =
      data.length > 0 ? Object.keys(data[0]) : tableFieldMap[tab] || [];
    const pk = idFields[tab];
    const fields = sourceFields
      .filter((k) => k !== pk)
      .filter((k) => {
        if (k.startsWith("id_")) return Boolean(fkOptions[k]);
        return true;
      });

    return (
      <div className="modal-bg" onClick={() => setModalOpen(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h2>{editing ? "Editar" : "Agregar"} {tab}</h2>
          <form onSubmit={handleSubmit}>
            {fields.map((key) => (
              <div className="form-field" key={key}>
                <label>{labelNames[key] || key}</label>

                {key === "fecha_venta" ? (
                  <input
                    type="date"
                    name={key}
                    value={formData[key] || ""}
                    onChange={handleChange}
                  />
                ) : fkOptions[key] ? (
                  <select
                    name={key}
                    value={formData[key] ?? ""}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar...</option>
                    {fkOptions[key].map((opt) => {
                      const idKey = Object.keys(opt).find((k) =>
                        k.startsWith("id_")
                      );
                      const idVal = opt[idKey];
                      const label =
                        opt.nombre_completo ||
                        opt.nombre ||
                        opt.titulo ||
                        opt.email ||
                        `ID ${idVal}`;
                      return (
                        <option key={idVal} value={idVal}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    name={key}
                    value={formData[key] ?? ""}
                    onChange={handleChange}
                    type={
                      key === "total_venta" ||
                      key === "precio" ||
                      key === "precio_unitario"
                        ? "number"
                        : key === "cantidad" || key === "stock"
                        ? "number"
                        : "text"
                    }
                    step={
                      key === "total_venta" ||
                      key === "precio" ||
                      key === "precio_unitario"
                        ? "0.01"
                        : undefined
                    }
                  />
                )}
              </div>
            ))}
            <button className="submit-btn" type="submit">
              {editing ? "Guardar cambios" : "Agregar"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const formatCell = (key, value) => {
    if (key === "fecha_venta" && value) return value.slice(0, 10);
    return value === null ? "—" : String(value);
  };

  return (
    <div className="container">
      <h1 className="title">Librería</h1>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {renderModal()}

      <table>
        <thead>
          <tr>
            {(data.length > 0
              ? Object.keys(data[0])
              : tableFieldMap[tab]
            ).map((col) => (
              <th key={col}>{labelNames[col] || col}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr key={i}>
                {Object.keys(row).map((k, j) => (
                  <td key={j}>{formatCell(k, row[k])}</td>
                ))}
                <td className="actions">
                  <button className="edit-btn" onClick={() => openEditModal(row)}>
                    Editar
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(row)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={(tableFieldMap[tab] || []).length + 1}>
                No hay datos
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="actions-table-bottom">
        <button className="add-btn" onClick={openAddModal}>
          Agregar {tab}
        </button>
      </div>
    </div>
  );
}
