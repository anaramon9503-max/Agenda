const SUPABASE_URL =
  "https://wbdijpsiovssuhxzzovi.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_T-fiB_MwofciQDOd7KWVOQ_LBVpq9xB";

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


let negocioActualId = null;
let profesionalEditandoId = null;


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


document
  .getElementById("btnVolver")
  .addEventListener(
    "click",
    () => {
      window.location.href = "panel.html";
    }
  );


document
  .getElementById("btnCerrar")
  .addEventListener(
    "click",
    cerrarSesion
  );


formularioProfesional.addEventListener(
  "submit",
  guardarProfesional
);


btnCancelarEdicion.addEventListener(
  "click",
  limpiarFormulario
);


async function revisarSesion() {

  const {
    data,
    error
  } = await db.auth.getSession();


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
    .select(
      "negocio_id, activo"
    )
    .eq(
      "usuario_id",
      usuarioId
    )
    .eq(
      "activo",
      true
    )
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
    .eq(
      "id",
      negocioActualId
    )
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
    .eq(
      "negocio_id",
      negocioActualId
    )
    .order(
      "nombre",
      {
        ascending: true
      }
    );


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
        document.createElement(
          "div"
        );


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
            ?
            `
            <div class="servicio-descripcion">
              ${escapar(
                profesional.especialidad
              )}
            </div>
            `
            :
            ""
        }


        <div class="servicio-acciones">

          <button
            class="btn-editar"
          >
            Editar
          </button>

          <button
            class="btn-activar"
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
          () => editarProfesional(profesional)
        );


      tarjeta
        .querySelector(".btn-activar")
        .addEventListener(
          "click",
          () => cambiarEstadoProfesional(profesional)
        );


      listaProfesionales.appendChild(
        tarjeta
      );

    }
  );
}


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


function limpiarFormulario() {

  profesionalEditandoId = null;

  formularioProfesional.reset();


  tituloFormularioProfesional.textContent =
    "Agregar profesional";


  btnCancelarEdicion
    .classList
    .add("oculto");
}


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
      .getElementById("profesionalNombre")
      .value
      .trim();


  const especialidad =
    document
      .getElementById("profesionalEspecialidad")
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

    ({
      error
    } = await db
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

    ({
      error
    } = await db
      .from("profesionales")
      .insert({
        negocio_id:
          negocioActualId,

        ...datos,

        activo:
          true
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


  const {
    error
  } = await db
    .from("profesionales")
    .update({
      activo:
        nuevoEstado
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


async function cerrarSesion() {

  await db.auth.signOut();

  window.location.href =
    "panel.html";
}


function mostrarError(
  texto
) {

  mensaje.textContent =
    texto;

  mensaje.className =
    "mensaje error";
}


function mostrarExito(
  texto
) {

  mensaje.textContent =
    texto;

  mensaje.className =
    "mensaje exito";
}


function ocultarMensaje() {

  mensaje.className =
    "mensaje oculto";
}


function escapar(
  texto
) {

  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


revisarSesion();
