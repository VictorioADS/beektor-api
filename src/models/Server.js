const express = require("express");
const cors = require("cors");
const conectarDB = require('../config/db');
const { createServer } = require("http");
const { socketController, emitId } = require("../sockets/controller");
const mqtt = require('mqtt');
const Sensores = require('../models/Sensores'); // Importar el modelo
const {crearSensor}=require('../controllers/SensoresController')

class Server {
 
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
 
        this.server = createServer(this.app);
 
        this.io = require("socket.io")(this.server, {
            cors: {
                origin: "*",
                allowedHeaders: ["my-custom-header"],
                credentials: true,
            },
        });
 
        this.paths = {
            usuario: "/api/usuarios",
            clientes: "/api/clientes",
            sucursales: "/api/sucursales",
            productos: "/api/productos",
            proveedores: "/api/proveedores",
            colmenas: "/api/colmenas",
            sensores: "/api/sensores",
            dashboard: "/api/dashboard"
        };
 
        this.middlewares();
        this.routes();
        this.socket();
        this.bd();
 
        // Conexión al broker MQTT
        this.conectarMQTT();
    }
 
    socket() {
        this.io.on("connection", (socket) => socketController(socket, this.io));
    }
 
    static get instance() {
        return this._intance || (this._intance = new this());
    }
 
    bd() {
        conectarDB();
    }
 
    middlewares() {
        // CORS
        this.app.use(cors());
 
        // Parseo y lectura del body
        this.app.use(express.json());
 
        // Directorio público
        this.app.use(express.static("public"));
    }
 
    routes() {
        this.app.use(this.paths.usuario, require("../routes/UsuarioRoutes"));
        this.app.use(this.paths.clientes, require("../routes/ClienteRoutes"));
        this.app.use(this.paths.sucursales, require("../routes/SucursalRoutes"));
        this.app.use(this.paths.productos, require("../routes/ProductoRoutes"));
        this.app.use(this.paths.proveedores, require("../routes/ProveedorRoutes"));
        this.app.use(this.paths.colmenas, require("../routes/ColmenaRoutes"));
        this.app.use(this.paths.sensores, require("../routes/SensoresRoutes"));
        this.app.use(this.paths.dashboard, require("../routes/DashboardRoutes"));
    }
 
    // CODIGO PARA SUCRIBIRSE AL TOPICO DEL ESP32
    conectarMQTT() {
        const client = mqtt.connect('mqtt://broker.hivemq.com');
 
        client.on('connect', () => {
            console.log('Conectado al broker MQTT');
            client.subscribe('sensores/beektor/tesis', (err) => {
                if (err) {
                    console.error('Error al suscribirse al tópico', err);
                }
            });
        });
 
        //MOLDEAS EL MENSAJE PARA TU TEMPE, HUME Y ID DE OBJETO
        client.on('message', async (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                const req = {
                    body: {
                        temperatura: data.temp,
                        humedad: data.hum,
                        colmena: data.colmena
                    }
                };
                const res = {                    
                    json: (data) => console.log('Datos guardados y enviados: ', data),        
                    status: (status) => ({
                    send: (message) => console.error('Error: ', status, message)
                    })          
                };                
                // Llamar al controlador para manejar la creación del sensor
                await crearSensor(req, res);

            } catch (error) {
                console.error('Error al ontener los datos del mqtt', error);
            }
        });

    }
 
    listen() {
        this.server.listen(this.port, () => {
            console.log("Servidor lanzado en el puerto", this.port);
        });
    }
}
 
module.exports = Server;