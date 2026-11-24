export function confirmarAccion(mensaje, accion) {
  return new Promise(resolve => {
    const dialogo = document.createElement("dialog");
    dialogo.className = "confirmacion-accion";
    dialogo.setAttribute("aria-label", accion);
    const texto = document.createElement("p");
    texto.textContent = mensaje;
    const acciones = document.createElement("div");
    const cancelar = document.createElement("button");
    cancelar.textContent = "Cancelar";
    cancelar.className = "res-boton-secundario";
    cancelar.autofocus = true;
    cancelar.onclick = () => dialogo.close();
    const aceptar = document.createElement("button");
    aceptar.textContent = accion;
    aceptar.className = "res-boton";
    aceptar.onclick = () => dialogo.close("confirmado");
    acciones.append(cancelar, aceptar);
    dialogo.append(texto, acciones);
    dialogo.addEventListener("close", () => {
      dialogo.remove();
      resolve(dialogo.returnValue === "confirmado");
    }, { once: true });
    document.body.append(dialogo);
    dialogo.showModal();
  });
}
