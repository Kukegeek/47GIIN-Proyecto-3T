# Declaración de Uso de Inteligencia Artificial — Sprint 1

Durante la planificación de este Sprint 1, he utilizado la Inteligencia Artificial como asistente para contrastar dudas sobre el orden de trabajo y organizar las tareas antes de ponerme a picar código.

### Aportación del autor
* Revisar el orden de los tickets del sprint para no hacer trabajo doble ni tener que rehacer código a mitad de camino.
* Decidir adelantar la auditoría (3T-06) justo después de montar la base de datos (3T-04), para que cuando cree los usuarios (3T-05) y los datos de la empresa (3T-07) ya se guarden los cambios de forma automática.
* Dejar la función de cálculo de distancias de TortuosityEngine (3T-08) como una pieza aparte, ya que son fórmulas matemáticas y no necesita para nada la base de datos.
* Fijar el orden final en el que voy a ir programando cada historia.

### Tareas asistidas con IA
* Contrastar con la IA si la idea de cambiar el orden de las tareas tenía sentido técnico.
* Ayuda para redactar de forma limpia la memoria del sprint y listar las subtareas de cada historia.

Todo el planteamiento y las decisiones de diseño han sido definidas y comprobadas por el autor.

---

### Anexo: Diálogo sobre el orden del sprint

* **Autor:** He estado mirando los tickets del Sprint 1 y creo que si seguimos el orden que viene en Jira vamos a perder tiempo rehaciendo cosas. ¿Cómo lo ves?
* **Respuesta IA:** El orden actual va en lista: wa-sqlite, usuarios, auditoría, organización y cálculo de ruta. Parece correcto porque la base de datos va al principio, aunque usuarios y empresa se podrían hacer seguidos.
* **Autor:** No lo veo claro. Si hago primero usuarios y luego monto la auditoría, tendré que volver al código de usuarios para meterle los registros de auditoría. Es mejor montar la auditoría justo después de la base de datos, así cuando haga usuarios y empresa ya se guardan los cambios solos. Y TortuosityEngine al ser solo matemáticas puede ir por separado.
* **Respuesta IA:** Tienes toda la razón, así te evitas tocar dos veces el mismo código. Si metes la auditoría nada más tener la base de datos, las altas y cambios de usuarios quedan registrados solos. El orden lógico para programar sería: 3T-04 -> 3T-06 -> 3T-05 -> 3T-07 -> 3T-08 -> 3T-09.
* **Autor:** Vale, pues prepárame la memoria del Sprint 1 con ese orden.
