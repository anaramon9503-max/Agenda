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


/* =========================
   ELEMENTOS
========================= */

const nombreNegocio =
  document.getElementById("nombreNegocio");

const correoUsuario =
  document.getElementById("correoUsuario");

const profesionalHorario =
  document.getElementById("profesionalHorario");

const servicioHorario =
  document.getElementById("servicioHorario");

const diaHorario =
  document.getElementById("diaHorario");

const horaInicio =
  document.getElementById("horaInicio");

const horaFin =
  document.getElementById("horaFin");

const listaHorarios =
  document.getElementById("listaHorarios");

const mensaje =
  document.getElementById("mensaje");


/* =========================
   BOTONES
========================= */

document
  .getElementById("btnVolver")
  .addEventListener(
    "click",
    () => {
      window.location.href =
        "panel.html";
    }
  );


document
  .getElementById("btnCerrar")
  .addEventListener(
    "click",
    cerrarSesion
  );


document
  .getElementById("btnGuardarHorario")
  .addEventListener(
    "click",
    guardarHorario
  );


/* =========================
   CAMBIO DE PROFESIONAL
========================= */

profesionalHorario.addEventListener(
  "change",
  async () => {

    ocultarMensaje();

    await cargarServiciosProfesional();

    await cargarHorarios();

  }
);


/* =========================
   CAMBIO DE SERVICIO
========================= */

servicioHorario.addEventListener(
  "change",
  async () => {

    ocultarMensaje();

    await cargarHorarios();

  }
);


/* =========================
   REVISAR SESIÓN
========================= */

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


  listaHorarios.innerHTML =
    `
      <div class="sin-resultados">
        Selecciona un profesional.
      </div>
    `;
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

    console.error(
      errorNegocio
    );

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

  profesionalHorario.innerHTML =
    `
      <option value="">
        Selecciona un profesional
      </option>
    `;


  const {
    data: profesionales,
    error
  } = await db
    .from("profesionales")
    .select(
      "id, nombre, activo"
    )
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


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible cargar los profesionales."
    );

    return;
  }


  (profesionales || [])
    .forEach(
      profesional => {

        const opcion =
          document.createElement(
            "option"
          );

        opcion.value =
          profesional.id;

        opcion.textContent =
          profesional.nombre;

        profesionalHorario
          .appendChild(
            opcion
          );

      }
    );
}


/* =========================
   SERVICIOS DEL PROFESIONAL
========================= */

async function cargarServiciosProfesional() {

  const profesionalId =
    profesionalHorario.value;


  servicioHorario.innerHTML =
    `
      <option value="">
        Selecciona un servicio
      </option>
    `;


  if (!profesionalId) {

    servicioHorario.innerHTML =
      `
        <option value="">
          Primero selecciona un profesional
        </option>
      `;

    return;
  }


  const {
    data: asignaciones,
    error: errorAsignaciones
  } = await db
    .from("profesional_servicios")
    .select(
      "servicio_id"
    )
    .eq(
      "profesional_id",
      profesionalId
    );


  if (errorAsignaciones) {

    console.error(
      errorAsignaciones
    );

    mostrarError(
      "No fue posible cargar los servicios del profesional."
    );

    return;
  }


  const idsServicios =
    (asignaciones || [])
      .map(
        item =>
          item.servicio_id
      );


  if (
    idsServicios.length === 0
  ) {

    servicioHorario.innerHTML =
      `
        <option value="">
          Este profesional no tiene servicios asignados
        </option>
      `;

    return;
  }


  const {
    data: servicios,
    error: errorServicios
  } = await db
    .from("servicios")
    .select(
      "id, nombre, activo"
    )
    .in(
      "id",
      idsServicios
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

    console.error(
      errorServicios
    );

    mostrarError(
      "No fue posible cargar los servicios."
    );

    return;
  }


  (servicios || [])
    .forEach(
      servicio => {

        const opcion =
          document.createElement(
            "option"
          );

        opcion.value =
          servicio.id;

        opcion.textContent =
          servicio.nombre;

        servicioHorario
          .appendChild(
            opcion
          );

      }
    );
}


/* =========================
   CARGAR HORARIOS
========================= */

async function cargarHorarios() {

  const profesionalId =
    profesionalHorario.value;

  const servicioId =
    servicioHorario.value;


  if (!profesionalId) {

    listaHorarios.innerHTML =
      `
        <div class="sin-resultados">
          Selecciona un profesional para ver sus horarios.
        </div>
      `;

    return;
  }


  if (!servicioId) {

    listaHorarios.innerHTML =
      `
        <div class="sin-resultados">
          Selecciona un servicio para ver sus horarios.
        </div>
      `;

    return;
  }


  listaHorarios.innerHTML =
    `
      <div class="cargando">
        Cargando horarios...
      </div>
    `;


  const {
    data: horarios,
    error
  } = await db
    .from("horarios")
    .select(`
      id,
      profesional_id,
      servicio_id,
      dia_semana,
      hora_inicio,
      hora_fin,
      activo
    `)
    .eq(
      "profesional_id",
      profesionalId
    )
    .eq(
      "servicio_id",
      servicioId
    )
    .order(
      "dia_semana",
      {
        ascending: true
      }
    )
    .order(
      "hora_inicio",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(error);

    listaHorarios.innerHTML =
      `
        <div class="sin-resultados">
          No fue posible cargar los horarios.
        </div>
      `;

    return;
  }


  if (
    !horarios ||
    horarios.length === 0
  ) {

    listaHorarios.innerHTML =
      `
        <div class="sin-resultados">
          Todavía no hay horarios configurados para este servicio.
        </div>
      `;

    return;
  }


  /*
    AGRUPAMOS POR DÍA
  */

  const horariosPorDia = {};


  horarios.forEach(
    horario => {

      if (
        !horariosPorDia[
          horario.dia_semana
        ]
      ) {

        horariosPorDia[
          horario.dia_semana
        ] = [];

      }


      horariosPorDia[
        horario.dia_semana
      ].push(
        horario
      );

    }
  );


  listaHorarios.innerHTML = "";


  /*
    UNA TARJETA POR DÍA
  */

  Object
    .keys(horariosPorDia)
    .sort(
      (a, b) =>
        Number(a) -
        Number(b)
    )
    .forEach(
      dia => {

        const tarjeta =
          document.createElement(
            "div"
          );

        tarjeta.className =
          "servicio-card horario-dia-card";


        const titulo =
          document.createElement(
            "div"
          );

        titulo.className =
          "servicio-nombre";

        titulo.textContent =
          nombreDia(
            Number(dia)
          );


        const contenedorHoras =
          document.createElement(
            "div"
          );

        contenedorHoras.className =
          "horas-grid";


        /*
          MOSTRAR HORAS ACTIVAS
        */

        horariosPorDia[dia]
          .filter(
            horario =>
              horario.activo
          )
          .forEach(
            horario => {

              const horas =
                generarHoras(
                  horario.hora_inicio,
                  horario.hora_fin
                );


              horas.forEach(
                hora => {

                  const chip =
                    document.createElement(
                      "span"
                    );

                  chip.className =
                    "hora-chip";

                  chip.textContent =
                    hora;

                  contenedorHoras
                    .appendChild(
                      chip
                    );

                }
              );

            }
          );


        if (
          contenedorHoras
            .children
            .length === 0
        ) {

          contenedorHoras.innerHTML =
            `
              <span class="sin-resultados">
                Sin horarios activos
              </span>
            `;

        }


        /*
          BLOQUES CONFIGURADOS
          PARA ACTIVAR / DESACTIVAR
        */

        const bloques =
          document.createElement(
            "div"
          );

        bloques.className =
          "horarios-bloques";


        horariosPorDia[dia]
          .forEach(
            horario => {

              const bloque =
                document.createElement(
                  "div"
                );

              bloque.className =
                "horario-bloque";


              const texto =
                document.createElement(
                  "span"
                );

              texto.textContent =
                `${formatearHora(
                  horario.hora_inicio
                )} - ${formatearHora(
                  horario.hora_fin
                )}`;


              const boton =
                document.createElement(
                  "button"
                );

              boton.type =
                "button";

              boton.className =
                "btn-activar";

              boton.textContent =
                horario.activo
                  ? "Desactivar"
                  : "Activar";


              boton.addEventListener(
                "click",
                () =>
                  cambiarEstadoHorario(
                    horario
                  )
              );


              bloque.appendChild(
                texto
              );

              bloque.appendChild(
                boton
              );

              bloques.appendChild(
                bloque
              );

            }
          );


        tarjeta.appendChild(
          titulo
        );

        tarjeta.appendChild(
          contenedorHoras
        );

        tarjeta.appendChild(
          bloques
        );

        listaHorarios.appendChild(
          tarjeta
        );

      }
    );
}


/* =========================
   GUARDAR HORARIO
========================= */

async function guardarHorario() {

  ocultarMensaje();


  const profesionalId =
    profesionalHorario.value;

  const servicioId =
    servicioHorario.value;

  const dia =
    Number(
      diaHorario.value
    );

  const inicio =
    horaInicio.value;

  const fin =
    horaFin.value;


  if (
    !profesionalId ||
    !servicioId ||
    !dia ||
    !inicio ||
    !fin
  ) {

    mostrarError(
      "Completa todos los datos del horario."
    );

    return;
  }


  if (
    inicio >= fin
  ) {

    mostrarError(
      "La hora de fin debe ser posterior a la hora de inicio."
    );

    return;
  }


  /*
    EVITAR HORARIOS CRUZADOS
    DEL MISMO SERVICIO
  */

  const {
    data: existentes,
    error: errorExistentes
  } = await db
    .from("horarios")
    .select(
      "id"
    )
    .eq(
      "profesional_id",
      profesionalId
    )
    .eq(
      "servicio_id",
      servicioId
    )
    .eq(
      "dia_semana",
      dia
    )
    .eq(
      "activo",
      true
    )
    .lt(
      "hora_inicio",
      fin
    )
    .gt(
      "hora_fin",
      inicio
    );


  if (errorExistentes) {

    console.error(
      errorExistentes
    );

    mostrarError(
      "No fue posible validar el horario."
    );

    return;
  }


  if (
    existentes &&
    existentes.length > 0
  ) {

    mostrarError(
      "Ese horario se cruza con otro horario del mismo servicio."
    );

    return;
  }


  /*
    GUARDAR
  */

  const {
    error
  } = await db
    .from("horarios")
    .insert({

      profesional_id:
        profesionalId,

      servicio_id:
        servicioId,

      dia_semana:
        dia,

      hora_inicio:
        inicio,

      hora_fin:
        fin,

      activo:
        true

    });


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible guardar el horario."
    );

    return;
  }


  mostrarExito(
    "Horario guardado correctamente."
  );


  diaHorario.value = "";

  horaInicio.value = "";

  horaFin.value = "";


  await cargarHorarios();
}


/* =========================
   ACTIVAR / DESACTIVAR
========================= */

async function cambiarEstadoHorario(
  horario
) {

  ocultarMensaje();


  const nuevoEstado =
    !horario.activo;


  const {
    error
  } = await db
    .from("horarios")
    .update({

      activo:
        nuevoEstado

    })
    .eq(
      "id",
      horario.id
    );


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible actualizar el horario."
    );

    return;
  }


  mostrarExito(
    nuevoEstado
      ? "Horario activado."
      : "Horario desactivado."
  );


  await cargarHorarios();
}


/* =========================
   GENERAR HORAS
========================= */

function generarHoras(
  horaInicio,
  horaFin
) {

  const resultado = [];


  const [
    inicioHora,
    inicioMinuto
  ] =
    horaInicio
      .slice(0, 5)
      .split(":")
      .map(Number);


  const [
    finHora,
    finMinuto
  ] =
    horaFin
      .slice(0, 5)
      .split(":")
      .map(Number);


  let actual =
    inicioHora * 60 +
    inicioMinuto;


  const final =
    finHora * 60 +
    finMinuto;


  while (
    actual < final
  ) {

    const horas =
      Math.floor(
        actual / 60
      );

    const minutos =
      actual % 60;


    resultado.push(
      `${String(horas)
        .padStart(2, "0")}:${String(minutos)
        .padStart(2, "0")}`
    );


    actual += 60;
  }


  return resultado;
}


/* =========================
   NOMBRE DEL DÍA
========================= */

function nombreDia(
  numero
) {

  const dias = {

    1: "Lunes",

    2: "Martes",

    3: "Miércoles",

    4: "Jueves",

    5: "Viernes",

    6: "Sábado",

    7: "Domingo"

  };


  return (
    dias[numero] ||
    "Día"
  );
}


/* =========================
   FORMATO DE HORA
========================= */

function formatearHora(
  hora
) {

  if (!hora) {
    return "";
  }


  return hora.slice(
    0,
    5
  );
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

  mensaje.textContent = "";

  mensaje.className =
    "mensaje oculto";
}


/* =========================
   INICIAR
========================= */

revisarSesion();
