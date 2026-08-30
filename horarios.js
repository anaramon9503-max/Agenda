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

let serviciosMapa = {};


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

const horaSlot =
  document.getElementById("horaSlot");

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
   CAMBIOS DE SELECTORES
========================= */

profesionalHorario.addEventListener(
  "change",
  async () => {

    ocultarMensaje();

    await cargarServiciosProfesional();

    await cargarHorarios();

  }
);


servicioHorario.addEventListener(
  "change",
  async () => {

    ocultarMensaje();

    await cargarHorarios();

  }
);


/* =========================
   SESIÓN
========================= */

async function revisarSesion() {

  const {
    data,
    error
  } =
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


  listaHorarios.innerHTML =
    `
      <div class="sin-resultados">
        Selecciona un profesional y un servicio.
      </div>
    `;
}


/* =========================
   NEGOCIO
========================= */

async function cargarNegocioUsuario(
  usuarioId
) {

  nombreNegocio.textContent =
    "Cargando...";


  const {
    data: membresias,
    error
  } =
    await db
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
  } =
    await db
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
   PROFESIONALES
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
  } =
    await db
      .from("profesionales")
      .select(
        "id, nombre"
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


  serviciosMapa = {};


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
  } =
    await db
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
      "No fue posible cargar los servicios."
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
    error
  } =
    await db
      .from("servicios")
      .select(
        "id, nombre, duracion_minutos"
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


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible cargar los servicios."
    );

    return;
  }


  (servicios || [])
    .forEach(
      servicio => {

        serviciosMapa[
          servicio.id
        ] = servicio;


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
          Selecciona un profesional.
        </div>
      `;

    return;
  }


  if (!servicioId) {

    listaHorarios.innerHTML =
      `
        <div class="sin-resultados">
          Selecciona un servicio.
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
  } =
    await db
      .from("horarios")
      .select(`
        id,
        dia_semana,
        hora_slot,
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
      .not(
        "hora_slot",
        "is",
        null
      )
      .eq(
        "activo",
        true
      )
      .order(
        "dia_semana",
        {
          ascending: true
        }
      )
      .order(
        "hora_slot",
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
          Todavía no has agregado horarios.
        </div>
      `;

    return;
  }


  const porDia = {};


  horarios.forEach(
    horario => {

      if (
        !porDia[
          horario.dia_semana
        ]
      ) {

        porDia[
          horario.dia_semana
        ] = [];

      }


      porDia[
        horario.dia_semana
      ].push(
        horario
      );

    }
  );


  listaHorarios.innerHTML = "";


  Object
    .keys(porDia)
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
          "horario-dia-card";


        const titulo =
          document.createElement(
            "h3"
          );

        titulo.textContent =
          nombreDia(
            Number(dia)
          );


        const horas =
          document.createElement(
            "div"
          );

        horas.className =
          "horas-grid";


        porDia[dia]
          .forEach(
            horario => {

              const chip =
                document.createElement(
                  "button"
                );


              chip.type =
                "button";


              chip.className =
                "hora-chip-admin";


              chip.innerHTML =
                `
                  ${formatearHora(
                    horario.hora_slot
                  )}
                  <span>×</span>
                `;


              chip.addEventListener(
                "click",
                () =>
                  eliminarHorario(
                    horario.id
                  )
              );


              horas.appendChild(
                chip
              );

            }
          );


        tarjeta.appendChild(
          titulo
        );

        tarjeta.appendChild(
          horas
        );

        listaHorarios.appendChild(
          tarjeta
        );

      }
    );
}


/* =========================
   GUARDAR UNA HORA
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

  const hora =
    horaSlot.value;


  if (
    !profesionalId ||
    !servicioId ||
    !dia ||
    !hora
  ) {

    mostrarError(
      "Selecciona profesional, servicio, día y hora."
    );

    return;
  }


  const servicio =
    serviciosMapa[
      servicioId
    ];


  if (!servicio) {

    mostrarError(
      "No fue posible identificar la duración del servicio."
    );

    return;
  }


  const duracion =
    Number(
      servicio.duracion_minutos
    );


  const horaFin =
    sumarMinutosHora(
      hora,
      duracion
    );


  if (!horaFin) {

    mostrarError(
      "La hora seleccionada no es válida."
    );

    return;
  }


  /* EVITAR DUPLICADOS */

  const {
    data: existentes,
    error: errorValidacion
  } =
    await db
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
        "hora_slot",
        hora
      )
      .eq(
        "activo",
        true
      );


  if (errorValidacion) {

    console.error(
      errorValidacion
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
      "Esa hora ya está agregada."
    );

    return;
  }


  /* GUARDAR */

  const {
    error
  } =
    await db
      .from("horarios")
      .insert({

        profesional_id:
          profesionalId,

        servicio_id:
          servicioId,

        dia_semana:
          dia,

        hora_slot:
          hora,

        hora_inicio:
          hora,

        hora_fin:
          horaFin,

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
    "Horario agregado correctamente."
  );


  horaSlot.value = "";


  await cargarHorarios();
}


/* =========================
   ELIMINAR HORA
========================= */

async function eliminarHorario(
  horarioId
) {

  const confirmar =
    window.confirm(
      "¿Quieres quitar esta hora?"
    );


  if (!confirmar) {
    return;
  }


  const {
    error
  } =
    await db
      .from("horarios")
      .delete()
      .eq(
        "id",
        horarioId
      );


  if (error) {

    console.error(error);

    mostrarError(
      "No fue posible quitar el horario."
    );

    return;
  }


  mostrarExito(
    "Horario eliminado."
  );


  await cargarHorarios();
}


/* =========================
   SUMAR DURACIÓN
========================= */

function sumarMinutosHora(
  hora,
  minutos
) {

  const partes =
    hora
      .split(":")
      .map(Number);


  if (
    partes.length < 2
  ) {
    return null;
  }


  let total =
    partes[0] * 60 +
    partes[1] +
    minutos;


  if (
    total >= 24 * 60
  ) {
    return null;
  }


  const h =
    Math.floor(
      total / 60
    );


  const m =
    total % 60;


  return (
    String(h)
      .padStart(2, "0")
    +
    ":"
    +
    String(m)
      .padStart(2, "0")
  );
}


/* =========================
   DÍAS
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
   FORMATO HORA
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
