# Declaración de Uso de Inteligencia Artificial — Sprint 1

Durante la planificación e inicio del desarrollo de este Sprint 1, he utilizado la Inteligencia Artificial como asistente para contrastar dudas sobre el orden de trabajo y agilizar la codificación de la base de datos, siempre bajo mi supervisión y criterio directo.

### Aportación del autor
* **Planificación del sprint:** Revisar los tickets del backlog y cambiar el orden para meter la auditoría (3T-06) antes que usuarios (3T-05) y empresa (3T-07), evitando rehacer código más adelante, y dejando TortuosityEngine (3T-08) como cálculo independiente.
* **Diseño técnico de la subtarea 1 de 3T-04:**
  * Decidir separar la base de datos en un Web Worker dedicado para que las consultas no congelen la pantalla del usuario.
  * Definir la estructura de comunicación entre el hilo principal y el worker mediante un protocolo de mensajes con identificador y promesas (acciones INIT, EXEC, QUERY y STATUS).
  * Indicar el uso de OriginPrivateFileSystemVFS para guardar datos en el disco local del navegador (OPFS), previendo un fallback en memoria si el entorno no lo soporta.
* **Control y depuración de pruebas:** Detectar que las pruebas se habían quedado colgadas sin motivo y exigir la revisión inmediata del mock del worker, localizando la promesa que no se estaba resolviendo.

### Tareas asistidas con IA
* Contrastar la viabilidad técnica del cambio de orden del backlog y redactar la memoria del sprint (docs/sprint-1_memoria.md).
* Escribir el código base del worker (src/db/worker.js) y del cliente (src/db/sqlite-client.js) siguiendo la estructura de mensajes indicada.
* Corregir el fallo en el mock de pruebas de sqlite-client.test.js para que los tests finalizaran correctamente en milisegundos.

Todo el planteamiento, decisiones de arquitectura y revisión del código han sido realizadas y verificadas por el autor.

---

### Anexo: Diálogo técnico con la IA

#### 1. Sobre el orden del sprint
* **Autor:** He estado mirando los tickets del Sprint 1 y creo que si seguimos el orden que viene en Jira vamos a perder tiempo rehaciendo cosas. ¿Cómo lo ves tú?
* **Respuesta IA:** El orden actual va en lista: wa-sqlite, usuarios, auditoría, organización y cálculo de ruta. Parece correcto porque la base de datos va al principio, aunque usuarios y empresa se podrían hacer seguidos.
* **Autor:** No lo veo claro. Si hago primero usuarios y luego monto la auditoría, tendré que volver al código de usuarios para meterle los registros de auditoría. Es mejor montar la auditoría justo después de la base de datos, así cuando haga usuarios y empresa ya se guardan los cambios solos. Y TortuosityEngine al ser solo matemáticas puede ir por separado.
* **Respuesta IA:** Tienes toda la razón, así te evitas tocar dos veces el mismo código. Si metes la auditoría nada más tener la base de datos, las altas y cambios de usuarios quedan registrados solos. El orden lógico para programar sería: 3T-04 -> 3T-06 -> 3T-05 -> 3T-07 -> 3T-08 -> 3T-09.
* **Autor:** Vale, pues prepárame la memoria del Sprint 1 con ese orden.

#### 2. Sobre la subtarea 1 de 3T-04 y corrección del test
* **Autor:** Para la subtarea 1 de 3T-04 quiero que separemos la base de datos de la interfaz. Móntame un Web Worker que cargue wa-sqlite con el sistema de archivos de OPFS, y una clase cliente en el hilo principal que se comunique con promesas y mensajes tipo INIT, EXEC, QUERY y STATUS.
* **Respuesta IA:** Entendido. He preparado el worker con wa-sqlite cargando el VFS de OPFS y la clase cliente con ese protocolo de promesas, además de un test para verificar el cliente.
* **Autor:** Oye, las pruebas se han quedado colgadas varios minutos y son dos comprobaciones simples, no tiene ningún sentido que tarde eso. Revisa bien qué has puesto en los tests porque alguna promesa se ha tenido que quedar sin resolver.
* **Respuesta IA:** Localizado el problema. En el mock del worker dentro de la prueba no se había conectado el manejador de mensajes del cliente, por lo que la promesa se quedaba esperando eternamente. He conectado el evento y ahora los tests pasan de inmediato en 79 milisegundos.
* **Autor:** Bien, ahora haz el commit de la subtarea 1 en git con ese cambio.
