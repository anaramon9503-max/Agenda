const SUPABASE_URL =
  "https://wbdijpsiovssuhxzzovi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_T-fiB_MwofciQDOd7KWVOQ_LBVpq9xB";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let negocioActualId = null;
let profesionalEditandoId = null;
let profesionalServiciosId = null;


/* =========================
   ELEMENTOS DE LA PÁGINA
========================= */

const nombreNegocio =
  document.getElementById("nombreNegocio");

const correoUsuario =
  document.getElementById("correoUsuario");

const listaProfesionales =
  document.getElementById("listaProfesionales");

const mensaje =
  document.getElementById("mensaje");

const formularioProfesional =
  document.getElementById("formularioProfesional");

const tituloFormularioProfesional =
  document.getElementById("tituloFormularioProfesional");

const btnCancelarEdicion =
  document.getElementById("btnCancelarEdicion");

const seccionServiciosProfesional =
  document.getElementById("seccionServiciosProfesional");

const nombreProfesionalServicios =
  document.getElementById("nombreProfesionalServicios");

const listaServiciosProfesional =
  document.getElementById("listaServiciosProfesional");

const btnGuardarServiciosProfesional =
  document.getElementById("btnGuardarServiciosProfesional");

const btnCerrarServiciosProfesional =
  document.getElementById("btnCerrarServiciosProfesional");


/* =========================
   BOTONES
========================= */

document
  .getElementById("btnVolver")
  .addEventListener("click", () => {
    window.location.href = "panel.html";
  });


document
  .getElementById("btnCerrar")
  .addEventListener("click", cerrarSesion);


formularioProfesional.addEventListener(
  "submit",
  guardarProfesional
);


btnCancelarEdicion.addEventListener(
  "click",
  limpiarFormulario
);


btnGuardarServiciosProfesional.addEventListener(
  "click",
  guardarServiciosProfesional
);


btnCerrarServiciosProfesional.addEventListener(
  "click",
  cerrarServiciosProfesional
);


/* =========================
   REVISAR SESIÓN
========================= */

async function revisarSesion() {

  const { data, error } =
    await db.auth.getSession();


  if (
    error ||
    !data.session ||
    !data.session.user
  ) {

    window.location.href =
      "panel.html";

    return;
  }


  const usuario =
    data.session.user;


  correoUsuario.textContent =
    usuario.email;


  const encontroNegocio =
    await cargarNegocioUsuario(
      usuario.id
    );


  if (!encontroNegocio) {
    return;
  }


  await cargarProfesionales();
}


/* =========================
   CARGAR NEGOCIO
========================= */

async function cargarNegocioUsuario(
  usuarioId
) {

  nombreNegocio.textContent =
    "Cargando...";


  const {
    data: membresias,
    error
  } = await db
    .from("miembros_negocio")
    .select("negocio_id, activo")
    .eq("usuario_id", usuarioId)
    .eq("activo", true)
    .limit(1);


  if (error) {

    console.error(error);

    nombreNegocio.textContent =
      "No disponible";

    mostrarError(
      "No fue posible identificar el negocio."
    );

    return false;
  }


  if (
    !membresias ||
    membresias.length === 0
  ) {

    nombreNegocio.textContent =
      "Sin negocio";

    mostrarError(
      "Esta cuenta no tiene un negocio asociado."
    );

    return false;
  }


  negocioActualId =
    membresias[0].negocio_id;


  const {
    data: negocios,
    error: errorNegocio
  } = await db
    .from("negocios_publicos")
    .select("id, nombre")
    .eq("id", negocioActualId)
    .limit(1);


  if (
    errorNegocio ||
    !negocios ||
    negocios.length === 0
  ) {

    console.error(errorNegocio);

    nombreNegocio.textContent =
      "Negocio";

    return true;
  }


  nombreNegocio.textContent =
    negocios[0].nombre;


  return true;
}


/* =========================
   CARGAR PROFESIONALES
========================= */

async function cargarProfesionales() {

  if (!negocioActualId) {
    return;
  }


  listaProfesionales.innerHTML =
    '<div class="cargando">Cargando profesionales...</div>';


  const {
    data: profesionales,
    error
  } = await db
    .from("profesionales")
    .select(`
      id,
      nombre,
      especialidad,
      activo
    `)
    .eq("negocio_id", negocioActualId)
    .order("nombre", {
      ascending: true
    });


  if (error) {

    console.error(error);

    listaProfesionales.innerHTML =
      '<div class="sin-resultados">No fue posible cargar los profesionales.</div>';

    return;
  }


  if (
    !profesionales ||
    profesionales.length === 0
  ) {

    listaProfesionales.innerHTML =
      '<div class="sin-resultados">Todavía no hay profesionales.</div>';

    return;
  }


  listaProfesionales.innerHTML = "";


  profesionales.forEach(
    profesional => {

      const tarjeta =
        document.createElement("div");


      tarjeta.className =
        "servicio-card";


      tarjeta.innerHTML = `

        <div class="servicio-cabecera">

          <div>

            <div class="servicio-nombre">
              ${escapar(profesional.nombre)}
            </div>

            <div
              class="servicio-estado ${
                profesional.activo
                  ? "activo"
                  : "inactivo"
              }"
            >
              ${
                profesional.activo
                  ? "Activo"
                  : "Inactivo"
              }
            </div>

          </div>

        </div>


        ${
          profesional.especialidad
            ? `
              <div class="servicio-descripcion">
                ${escapar(
                  profesional.especialidad
                )}
              </div>
            `
            : ""
        }


        <div class="servicio-acciones">

          <button
            class="btn-editar"
            type="button"
          >
            Editar
          </button>

          <button
            class="btn-servicios"
            type="button"
          >
            Servicios
          </button>

          <button
            class="btn-activar"
            type="button"
          >
            ${
              profesional.activo
                ? "Desactivar"
                : "Activar"
            }
          </button>

        </div>

      `;


      tarjeta
        .querySelector(".btn-editar")
        .addEventListener(
          "click",
          () =>
            editarProfesional(
              profesional
            )
        );


      tarjeta
        .querySelector(".btn-servicios")
        .addEventListener(
          "click",
          () =>
            abrirServiciosProfesional(
              profesional
            )
        );


      tarjeta
        .querySelector(".btn-activar")
        .addEventListener(
          "click",
          () =>
            cambiarEstadoProfesional(
              profesional
            )
        );


      listaProfesionales.appendChild(
        tarjeta
      );

    }
  );
}


/* =========================
   EDITAR PROFESIONAL
========================= */

function editarProfesional(
  profesional
) {

  ocultarMensaje();


  profesionalEditandoId =
    profesional.id;


  tituloFormularioProfesional.textContent =
    "Editar profesional";


  document
    .getElementById("profesionalNombre")
    .value =
      profesional.nombre || "";


  document
    .getElementById("profesionalEspecialidad")
    .value =
      profesional.especialidad || "";


  btnCancelarEdicion
    .classList
    .remove("oculto");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   LIMPIAR FORMULARIO
========================= */

function limpiarFormulario() {

  profesionalEditandoId = null;

  formularioProfesional.reset();


  tituloFormularioProfesional.textContent =
    "Agregar profesional";


  btnCancelarEdicion
    .classList
    .add("oculto");
}


/* =========================
   GUARDAR PROFESIONAL
========================= */

async function guardarProfesional(
  evento
) {

  evento.preventDefault();

  ocultarMensaje();


  if (!negocioActualId) {

    mostrarError(
      "No se encontró el negocio."
    );

    return;
  }


  const nombre =
    document
      .getElementById(
        "profesionalNombre"
      )
      .value
      .trim();


  const especialidad =
    document
      .getElementById(
        "profesionalEspecialidad"
      )
      .value
      .trim();


  if (!nombre) {

    mostrarError(
      "Escribe el nombre del profesional."
    );

    return;
  }


  const datos = {
    nombre,
    especialidad:
      especialidad || null
  };


  let error;


  if (profesionalEditandoId) {

    ({ error } = await db
      .from("profesionales")
      .update(datos)
      .eq(
        "id",
        profesionalEditandoId
      )
      .eq(
        "negocio_id",
        negocioActualId
      ));

  } else {

    ({ error } = await db
      .from("profesionales")
      .insert({
        negocio_id:
          negocioActualId,

        ...datos,

        activo: true
      }));

  }


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible guardar el profesional."
    );

    return;
  }


  mostrarExito(
    profesionalEditandoId
      ? "Profesional actualizado correctamente."
      : "Profesional agregado correctamente."
  );


  limpiarFormulario();

  await cargarProfesionales();
}


/* =========================
   ACTIVAR / DESACTIVAR
========================= */

async function cambiarEstadoProfesional(
  profesional
) {

  ocultarMensaje();


  const nuevoEstado =
    !profesional.activo;


  const texto =
    nuevoEstado
      ? "activar"
      : "desactivar";


  const confirmar =
    window.confirm(
      `¿Seguro que deseas ${texto} "${profesional.nombre}"?`
    );


  if (!confirmar) {
    return;
  }


  const { error } = await db
    .from("profesionales")
    .update({
      activo: nuevoEstado
    })
    .eq(
      "id",
      profesional.id
    )
    .eq(
      "negocio_id",
      negocioActualId
    );


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible actualizar el profesional."
    );

    return;
  }


  mostrarExito(
    nuevoEstado
      ? "Profesional activado."
      : "Profesional desactivado."
  );


  await cargarProfesionales();
}


/* =========================
   ABRIR SERVICIOS
========================= */

async function abrirServiciosProfesional(
  profesional
) {

  ocultarMensaje();


  profesionalServiciosId =
    profesional.id;


  nombreProfesionalServicios.textContent =
    profesional.nombre;


  seccionServiciosProfesional
    .classList
    .remove("oculto");


  listaServiciosProfesional.innerHTML =
    '<div class="cargando">Cargando servicios...</div>';


  const {
    data: servicios,
    error: errorServicios
  } = await db
    .from("servicios")
    .select(`
      id,
      nombre,
      activo
    `)
    .eq(
      "negocio_id",
      negocioActualId
    )
    .eq(
      "activo",
      true
    )
    .order(
      "nombre",
      {
        ascending: true
      }
    );


  if (errorServicios) {

    console.error(errorServicios);

    listaServiciosProfesional.innerHTML =
      '<div class="sin-resultados">No fue posible cargar los servicios.</div>';

    return;
  }


  const {
    data: asignaciones,
    error: errorAsignaciones
  } = await db
    .from("profesional_servicios")
    .select("servicio_id")
    .eq(
      "profesional_id",
      profesional.id
    );


  if (errorAsignaciones) {

    console.error(
      errorAsignaciones
    );

    listaServiciosProfesional.innerHTML =
      '<div class="sin-resultados">No fue posible cargar las asignaciones.</div>';

    return;
  }


  const asignados =
    new Set(
      (asignaciones || []).map(
        item => item.servicio_id
      )
    );


  listaServiciosProfesional.innerHTML =
    "";


  if (
    !servicios ||
    servicios.length === 0
  ) {

    listaServiciosProfesional.innerHTML =
      '<div class="sin-resultados">No hay servicios activos.</div>';

    return;
  }


  servicios.forEach(
    servicio => {

      const fila =
        document.createElement(
          "label"
        );


      fila.style.display =
        "flex";

      fila.style.alignItems =
        "center";

      fila.style.gap =
        "10px";

      fila.style.padding =
        "12px";

      fila.style.marginBottom =
        "8px";

      fila.style.border =
        "1px solid #e5dfe8";

      fila.style.borderRadius =
        "12px";


      fila.innerHTML = `

        <input
          type="checkbox"
          class="servicio-check"
          value="${servicio.id}"
          ${
            asignados.has(
              servicio.id
            )
              ? "checked"
              : ""
          }
          style="
            width:auto;
            margin:0;
          "
        >

        <span>
          ${escapar(
            servicio.nombre
          )}
        </span>

      `;


      listaServiciosProfesional
        .appendChild(fila);

    }
  );


  seccionServiciosProfesional
    .scrollIntoView({
      behavior: "smooth"
    });
}


/* =========================
   GUARDAR SERVICIOS
========================= */

async function guardarServiciosProfesional() {

  ocultarMensaje();


  if (!profesionalServiciosId) {

    mostrarError(
      "No se seleccionó un profesional."
    );

    return;
  }


  const checks =
    Array.from(
      document.querySelectorAll(
        ".servicio-check"
      )
    );


  const serviciosSeleccionados =
    checks
      .filter(
        check => check.checked
      )
      .map(
        check => check.value
      );


  const {
    error: errorEliminar
  } = await db
    .from("profesional_servicios")
    .delete()
    .eq(
      "profesional_id",
      profesionalServiciosId
    );


  if (errorEliminar) {

    console.error(
      errorEliminar
    );

    mostrarError(
      "No fue posible actualizar los servicios."
    );

    return;
  }


  if (
    serviciosSeleccionados.length > 0
  ) {

    const nuevasAsignaciones =
      serviciosSeleccionados.map(
        servicioId => ({
          profesional_id:
            profesionalServiciosId,

          servicio_id:
            servicioId
        })
      );


    const {
      error: errorInsertar
    } = await db
      .from(
        "profesional_servicios"
      )
      .insert(
        nuevasAsignaciones
      );


    if (errorInsertar) {

      console.error(
        errorInsertar
      );

      mostrarError(
        "No fue posible guardar los servicios seleccionados."
      );

      return;
    }
  }


  mostrarExito(
    "Servicios del profesional actualizados correctamente."
  );


  cerrarServiciosProfesional();
}


/* =========================
   CERRAR SERVICIOS
========================= */

function cerrarServiciosProfesional() {

  profesionalServiciosId = null;


  seccionServiciosProfesional
    .classList
    .add("oculto");


  listaServiciosProfesional.innerHTML =
    "";
}


/* =========================
   CERRAR SESIÓN
========================= */

async function cerrarSesion() {

  await db.auth.signOut();

  window.location.href =
    "panel.html";
}


/* =========================
   MENSAJES
========================= */

function mostrarError(texto) {

  mensaje.textContent =
    texto;

  mensaje.className =
    "mensaje error";
}


function mostrarExito(texto) {

  mensaje.textContent =
    texto;

  mensaje.className =
    "mensaje exito";
}


function ocultarMensaje() {

  mensaje.className =
    "mensaje oculto";
}


/* =========================
   SEGURIDAD DE TEXTO
========================= */

function escapar(texto) {

  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   INICIAR
========================= */

revisarSesion();
