import assert from "node:assert/strict";
import test from "node:test";
import { interpretarNota, prepararEntrega, prepararTarea, validarArchivos, validarMisTareas } from "../src/utils/tareas.js";

test("las notas deben estar entre 0 y 10", () => {
  assert.equal(interpretarNota("0"), 0);
  assert.equal(interpretarNota("10"), 10);
  assert.equal(interpretarNota("7,5"), 7.5);
  for (const valor of ["", "-1", "10.1", "233333"]) {
    assert.throws(() => interpretarNota(valor), /entre 0 y 10/);
  }
});

test("una tarea requiere título, alumnos y fecha futura en horario argentino", () => {
  const datos = prepararTarea("clase", "  Tarea ", " Consigna ", ["alumno"], "2030-01-02T02:30:00Z", Date.parse("2030-01-01T00:00:00Z"));
  assert.deepEqual(datos, { id_clase: "clase", titulo: "Tarea", descripcion: "Consigna", id_alumno: ["alumno"], fechaLimite: "2030-01-01T23:30" });
  assert.throws(() => prepararTarea("clase", " ", "", ["alumno"], ""), /título/);
  assert.throws(() => prepararTarea("clase", "Tarea", "", [], ""), /alumnos/);
  assert.throws(() => prepararTarea("clase", "Tarea", "", ["alumno"], "2000-01-01T00:00:00Z"), /futura/);
});

test("las entregas y archivos respetan los límites del backend", () => {
  assert.throws(() => prepararEntrega(" ", 0), /respuesta o adjuntá/);
  assert.equal(prepararEntrega(" respuesta ", 0), "respuesta");
  assert.equal(prepararEntrega("", 1), "");
  const archivo = { name: "guia.pdf", size: 1024 };
  assert.deepEqual(validarArchivos([archivo]), [archivo]);
  assert.throws(() => validarArchivos(Array(4).fill(archivo)), /3 archivos/);
  assert.throws(() => validarArchivos([{ ...archivo, name: "guia.exe" }]), /PDF/);
  assert.throws(() => validarArchivos([{ ...archivo, size: 4 * 1024 * 1024 + 1 }]), /4 MB/);
});

test("la sección de tareas admite las clases asignadas y rechaza respuestas incompletas", () => {
  const tarea = { tarea: { id_tarea: "tarea", titulo: "Ejercicio", adjuntos: [], clase: { id_clase: "clase", titulo: "Matemática" } }, archivos: [] };
  assert.doesNotThrow(() => validarMisTareas([tarea]));
  assert.doesNotThrow(() => validarMisTareas([]));
  assert.throws(() => validarMisTareas([{ ...tarea, tarea: { ...tarea.tarea, clase: null } }]), /clase inválidos/);
  assert.throws(() => validarMisTareas([{ ...tarea, archivos: null }]), /entregas inválidas/);
});
