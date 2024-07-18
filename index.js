const express = require("express"); 
const axios = require("axios"); 
const fs = require("fs");

const app = express(); 
const PORT = 3000; 

// Inicializamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}/ `);
});


// Ruta principal para levantar el html
app.get("/", (req, res) => {
  try {
    const { nombre, precio } = req.query; 
    // Verificamos si hay parámetros inmediatos después de la raíz
    if (nombre || precio) {
      return res.send("Error en la ruta, esta ruta no acepta parámetros"); // Enviar un mensaje de error
    }
  } catch (error) {
    console.error("Error en la ruta ", error.message);
    return res.send("Error en la ruta");
  }
  //Muestra el index
  res.sendFile(__dirname + "/index.html"); 
});


// Ruta para agregar un nuevo deporte, recibe el nombre y precio, lo persiste en un archivo JSON
app.get("/agregar", (req, res) => {
  const { nombre, precio } = req.query; 

  // Manejo de error si falta alguno de los parámetros 
  if (!nombre || !precio) {
    console.log(
      "Faltan parámetros, se requiere nombre y precio"
    );
    return res.send(
      "Faltan parámetros, se requiere nombre y precio" //los res.send aparecen como alerts, de lo contrario sólo aparece mensaje en terminal/consola
    ); 
  }

  // Validación de que el parámetro "precio" sea un número:
  if (isNaN(Number(precio))) {
    console.log("El precio ingresado no es válido, debe ser un número");
    return res.send("El precio ingresado no es válido, debe ser un número");
  }

  let deportes = []; //arreglo para almacenar los deportes

  // Se carga el contenido actual del archivo JSON
  try {
    deportes = JSON.parse(fs.readFileSync("ListaDeportes.json", "utf8"));
  } catch (error) {
    // Si el archivo no existe, se crea
    if (error.code === "ENOENT") {
      console.log(
        "Archivo ListaDeportes.json no encontrado, creando archivo..."
      );
      fs.writeFileSync("ListaDeportes.json", JSON.stringify(deportes)); //se crea el archivo vacío
    } else {
      console.error("Error al leer el archivo Json: ", error.message);
      return res.status(500).json("Error interno del servidor");
    }
  } 

  // Verifica si el nombre del deporte ya existe en la lista de deportes
  const deporteExistente = deportes.find(
    (deporte) => deporte.nombre === nombre
  ); //la función find devuelve el primer elemento de un array que cumple con la condición
  if (deporteExistente) {
    console.log("El nombre del deporte ya está en uso");
    return res.send("El nombre del deporte ya está en uso");
  }

  // Se crea el objeto con los datos del deporte
  const deporte = { nombre, precio };

  // Se agrega el nuevo deporte al arreglo
  deportes.push(deporte);

  // Se guarda el objeto en el archivo JSON
  fs.writeFile("ListaDeportes.json", JSON.stringify(deportes), (err) => {
    if (err) {
      console.error("Error al escribir el archivo:", err);
      return res.status(500).json({
        error: "Error interno del servidor",
      });
    }
    console.log("Deporte guardado con éxito: ", deporte);
    // Se devuelve un mensaje de éxito
    res.send("Deporte guardado con éxito");
  });
});


// Ruta para listar los deportes
app.get("/deportes", (req, res) => {
  fs.readFile("ListaDeportes.json", "utf8", (err, datosdeportes) => {
    //lectura de archivo, con función callback 2 parámetros: err y datosdeportes tendrá los datos leídos del archivo si la operación se realiza con éxito
    if (err) {
      console.error(err);
      return res.send("Error interno del servidor");
    }
    // const contenidodeportes = JSON.parse(datosdeportes); //parsear el string a arreglo json: se convierte a arreglo de objetos js
    // res.json(JSON.parse(datosdeportes)); // se envian datos de deportes directamente sin incluirlos en un objeto con propiedad, por lo tanto el cliente no puede acceder directametne a "data.data.deportes" ya que no hay propiedad deportes en el objeto
    res.json({ deportes: JSON.parse(datosdeportes) }); // se envía objeto JSON con propiedad deporte que contiene los datos, el html puede leerlos
  });
});

// Ruta para editar los deportes
app.get("/editar", (req, res) => {
  // Se extraen parámetros de la URL
  const { nombre, precio } = req.query; //destructuring obtengo los parametros que necesito del objeto query, los valores que acompañan a la ruta
  const nuevoPrecio = { nombre, precio }; //almaceno en nueva variable los nuevos datos a editar

  if (!nombre || !precio) {
    //validación de datos ingresados
    console.log("No se puede editar, faltan parámetros");
    return res.send(
      "No se puede editar, faltan parámetros: se requiere nombre y precio"
    );
  }
  // Validación de que el parámetro "precio" sea un número:
  if (isNaN(Number(precio))) {
    console.log("El precio ingresado no es válido, debe ser un número");
    return res.send("El precio ingresado no es válido, debe ser un número");
  }

  const deportes = JSON.parse(fs.readFileSync("ListaDeportes.json", "utf8")); // lee ListaDeportes.json, lo y convierte el texto en un objeto/arreglo js con parse
  console.log("valor de data/deportes: ", deportes); 

  //se debe acceder a las propiedades de los elementos individuales dentro del arreglo:
  let busqueda = deportes.findIndex(
    (elem) => elem.nombre == nuevoPrecio.nombre
  ); //realiza una búsqueda dentro del arreglo deportes para encontrar el índice del elemento que tiene el nombre de deporte igual al valor almacenado en "nuevoPrecio.nombre"

  if (busqueda == -1) {
    //si el index entrega -1, es elemento no encontrado, en ese caso el deporte no existe y no se puede editar
    console.log("El deporte: " + nuevoPrecio.nombre + " no existe");
    return res.send("El deporte buscado no existe"); //mensaje al usuario
  }
  console.log("El deporte a editar es: ", deportes[busqueda]); 

  deportes[busqueda].precio = precio; // se modifica el precio del deporte

  try {
    fs.writeFileSync("ListaDeportes.json", JSON.stringify(deportes)); //se sobreescribe el archivo
    console.log(
      "valor de deportes después de editar: ",
      deportes,
      "Deporte editado con éxito: ",
      nuevoPrecio
    );
    console.log(
      "Precio del deporte actualizado con éxito: ",
      deportes[busqueda].precio
    );
  } catch {
    //si hay error en el proceso anterior muestra el error
    console.error("Error al escribir en el archivo JSON:", error.message);
    return res.status(500).send("Error interno del servidor");
  }

  res.send("Edición realizada con éxito"); //mensaje al usuario si todo el proceso sucede con éxito.
});

//Ruta para eliminar a un usuario
app.get("/eliminar/:nombre", (req, res) => {
  //creación de ruta para eliminar a través de req.params

  const deporteEliminar = req.params.nombre; //se obtiene el nombre del deporte a eliminar y se asigna a variable
  // console.log("valor de  deporteEliminar: ", deporteEliminar); //verificación

  if (!deporteEliminar) {
    console.log("Error, falta parametro");
    return res.send("Falta el parámetro 'nombre' del deporte");
  }

  const deportes = JSON.parse(fs.readFileSync("ListaDeportes.json", "utf8")); // lee ListaDeportes.json, lo y convierte el texto en un objeto/arreglo js con parse
  console.log("valor de data/deportes: ", deportes); //deporte es un arreglo. verificación

  //se debe acceder a las propiedades de los elementos individuales dentro del arreglo:
  let busqueda = deportes.findIndex((elem) => elem.nombre == deporteEliminar); //realiza una búsqueda dentro del arreglo deportes para encontrar el índice del elemento que tiene el nombre de deporte igual al valor almacenado en "deporteElmiminar"

  if (busqueda == -1) {
    //si el index entrega -1, es elemento no encontrado, en ese caso el deporte no existe y no se puede eliminar
    console.log("El deporte: " + deporteEliminar + " no existe");
    return res.send("El deporte buscado no existe"); //mensaje al usuario
  }
  console.log("El deporte a eliminar es: ", deportes[busqueda]); 
  deportes.splice(busqueda, 1); //se usa método splice

  try {
    fs.writeFileSync("ListaDeportes.json", JSON.stringify(deportes)); //se sobreescribe el archivo
    console.log(
      "valor de deportes después de eliminación: ",
      deportes,
      "Deporte eliminado con éxito: ",
      deporteEliminar
    );
  } catch {
    //si hay error en el proceso anterior muestra el error
    console.error("Error al escribir en el archivo JSON:", error.message);
    return res.status(500).send("Error interno del servidor");
  }

  res.send("Eliminacion finalizada"); //Mensaje al usuario si todo el proceso sucede con éxito.
});

//Control de rutas no existentes
app.get("*", (req, res) => {
  res.status(404).send("Esta página no existe");
});
