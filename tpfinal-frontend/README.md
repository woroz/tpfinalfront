# React + Vite

## Tareas de las clases

En Clases programadas, el profesor puede asignar una tarea por clase a alumnos confirmados, seleccionar a todos, consultar las entregas y registrar o modificar una nota de 0 a 10 después de recibirlas. Desde Tareas en Inicio o desde Mis clases, el alumno puede consultar la consigna, adjuntar hasta tres archivos, entregar su respuesta y ver la nota. El seguimiento de la clase es independiente de las tareas. Estas acciones requieren conexión. Los avisos y la limitación entre dispositivos requieren la versión actualizada del backend.

Para comprobar las validaciones: `node --test pruebas/tareas.test.mjs`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
