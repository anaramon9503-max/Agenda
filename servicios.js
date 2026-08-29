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
let servicioEditandoId = null;


const nombreNegocio =
  document.getElementById("nombreNegocio");

const correoUsuario =
  document.getElementById("correoUsuario");

const listaServicios =
  document.getElementById("listaServicios");

const mensaje =
  document.getElementById("mensaje");

const formularioServicio =
  document.getElementById("formularioServicio");

const tituloFormularioServicio =
  document.getElementById("tituloFormularioServicio");

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


formularioServicio.addEventListener(
  "submit",
  guardarServicio
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


  await cargarServicios();
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
    .select(
      "id, nombre"
    )
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


async function cargarServicios() {

  if (!negocioActualId) {
    return;
  }


  listaServicios.innerHTML =
    '<div class="cargando">Cargando servicios...</div>';


  const {
    data: servicios,
    error
  } = await db
    .from("servicios")
    .select(`
      id,
      nombre,
      descripcion,
      duracion_minutos,
      precio,
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

    listaServicios.innerHTML =
      '<div class="sin-resultados">No fue posible cargar los servicios.</div>';

    return;
  }


  if (
    !servicios ||
    servicios.length === 0
  ) {

    listaServicios.innerHTML =
      '<div class="sin-resultados">Todavía no hay servicios.</div>';

    return;
  }


  listaServicios.innerHTML = "";


  servicios.forEach(
    servicio => {

      const tarjeta =
        document.createElement(
          "div"
        );


      tarjeta.className =
        "servicio-card";


      const precio =
        Number(
          servicio.precio || 0
        ).toLocaleString(
          "es-MX",
          {
            style: "currency",
            currency: "MXN"
          }
        );


      tarjeta.innerHTML = `

        <div class="servicio-cabecera">

          <div>

            <div class="servicio-nombre">
              ${escapar(servicio.nombre)}
            </div>

            <div
              class="servicio-estado ${
                servicio.activo
                  ? "activo"
                  : "inactivo"
              }"
            >
              ${
                servicio.activo
                  ? "Activo"
                  : "Inactivo"
              }
            </div>

          </div>

          <div class="servicio-precio">
            ${precio}
          </div>

        </div>


        ${
          servicio.descripcion
            ?
            `
            <div class="servicio-descripcion">
              ${escapar(
                servicio.descripcion
              )}
            </div>
            `
            :
            ""
        }


        <div class="servicio-meta">
          ⏱️ ${servicio.duracion_minutos} min
        </div>


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
              servicio.activo
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
          () => editarServicio(servicio)
        );


      tarjeta
        .querySelector(".btn-activar")
        .addEventListener(
          "click",
          () => cambiarEstadoServicio(servicio)
        );


      listaServicios.appendChild(
        tarjeta
      );

    }
  );
}


function editarServicio(
  servicio
) {

  ocultarMensaje();

  servicioEditandoId =
    servicio.id;


  tituloFormularioServicio.textContent =
    "Editar servicio";


  document
    .getElementById("servicioNombre")
    .value =
      servicio.nombre || "";


  document
    .getElementById("servicioDescripcion")
    .value =
      servicio.descripcion || "";


  document
    .getElementById("servicioDuracion")
    .value =
      servicio.duracion_minutos || 60;


  document
    .getElementById("servicioPrecio")
    .value =
      servicio.precio ?? "";


  btnCancelarEdicion
    .classList
    .remove("oculto");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function limpiarFormulario() {

  servicioEditandoId = null;

  formularioServicio.reset();


  document
    .getElementById("servicioDuracion")
    .value = "60";


  tituloFormularioServicio.textContent =
    "Agregar servicio";


  btnCancelarEdicion
    .classList
    .add("oculto");
}


async function guardarServicio(
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
      .getElementById("servicioNombre")
      .value
      .trim();


  const descripcion =
    document
      .getElementById("servicioDescripcion")
      .value
      .trim();


  const duracion =
    Number.parseInt(
      document
        .getElementById("servicioDuracion")
        .value,
      10
    );


  const precio =
    Number.parseFloat(
      document
        .getElementById("servicioPrecio")
        .value
    );


  if (!nombre) {

    mostrarError(
      "Escribe el nombre del servicio."
    );

    return;
  }


  if (
    !Number.isInteger(duracion) ||
    duracion <= 0
  ) {

    mostrarError(
      "Escribe una duración válida."
    );

    return;
  }


  if (
    !Number.isFinite(precio) ||
    precio < 0
  ) {

    mostrarError(
      "Escribe un precio válido."
    );

    return;
  }


  const datos = {

    nombre,

    descripcion:
      descripcion || null,

    duracion_minutos:
      duracion,

    precio

  };


  let error;


  if (servicioEditandoId) {

    ({
      error
    } = await db
      .from("servicios")
      .update(datos)
      .eq(
        "id",
        servicioEditandoId
      )
      .eq(
        "negocio_id",
        negocioActualId
      ));

  } else {

    ({
      error
    } = await db
      .from("servicios")
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
      "No fue posible guardar el servicio."
    );

    return;
  }


  mostrarExito(
    servicioEditandoId
      ? "Servicio actualizado correctamente."
      : "Servicio agregado correctamente."
  );


  limpiarFormulario();

  await cargarServicios();
}


async function cambiarEstadoServicio(
  servicio
) {

  ocultarMensaje();


  const nuevoEstado =
    !servicio.activo;


  const texto =
    nuevoEstado
      ? "activar"
      : "desactivar";


  const confirmar =
    window.confirm(
      `¿Seguro que deseas ${texto} "${servicio.nombre}"?`
    );


  if (!confirmar) {
    return;
  }


  const {
    error
  } = await db
    .from("servicios")
    .update({
      activo:
        nuevoEstado
    })
    .eq(
      "id",
      servicio.id
    )
    .eq(
      "negocio_id",
      negocioActualId
    );


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible actualizar el servicio."
    );

    return;
  }


  mostrarExito(
    nuevoEstado
      ? "Servicio activado."
      : "Servicio desactivado."
  );


  await cargarServicios();
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
