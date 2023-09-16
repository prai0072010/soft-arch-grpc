const PROTO_PATH = "./restaurant.proto";

var grpc = require("@grpc/grpc-js");

var protoLoader = require("@grpc/proto-loader");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var restaurantProto = grpc.loadPackageDefinition(packageDefinition);


const server = new grpc.Server();

require('dotenv').config({ path: './server/config.env' });
const Menu = require('./models/Menu');
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);
mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

server.addService(restaurantProto.RestaurantService.service, {
    getAllMenu: async (call) => {
        // getting all menu
        let menuList
        try {
            menuList = await Menu.find()
        } catch (err) {
            console.log("getAllMenu error: ", err)
            call.end();
        }
        menuList.forEach(menuItem => {
            // write stream
            call.write(menuItem);
        });

        // end stream
        call.end();
    },
    get: async (call, callback) => {
        // getting mennu
        let menuItem
        try {
            menuItem = await getMenu(call.request.id)
        } catch (err) {
            console.log("get error: ", err)
            switch (err.message) {
                case "Not Found":
                    callback({
                        code: grpc.status.NOT_FOUND,
                        details: "Menu not found"
                    });
                    break;
                default:
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error occurr when getting menu"
                    });
            }
        }

        // success callback
        callback(null, menuItem);
    },
    insert: async (call, callback) => {
        // create menu
        const newMenu = new Menu({
            name: call.request.name,
            price: call.request.price
        })

        // save menu
        try {
            await newMenu.save()
        } catch (err) {
            console.log("insert error: ", err)
            callback({
                code: grpc.status.INTERNAL,
                details: "Error occurr when inserting menu"
            });
        }

        // success callback
        callback(null, newMenu);
    },
    update: async (call, callback) => {
        // getting menu
        let existingMenuItem
        try {
            existingMenuItem = await getMenu(call.request.id)
        } catch (err) {
            console.log("update error: ", err)
            switch (err.message) {
                case "Not Found":
                    callback({
                        code: grpc.status.NOT_FOUND,
                        details: "Menu not found"
                    });
                    break;
                default:
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error occurr when getting menu"
                    });
            }
        }

        // updating menu
        existingMenuItem.name = call.request.name;
        existingMenuItem.price = call.request.price;

        let updatedMenu
        try {
            updatedMenu = await existingMenuItem.save()
        } catch (err) {
            console.log("update error: ", err)
            callback({
                code: grpc.status.INTERNAL,
                details: "Error occurr when updating menu"
            });
        }

        // success callback
        callback(null, updatedMenu);
    },
    remove: async (call, callback) => {
        // getting menu
        let existingMenuItem
        try {
            existingMenuItem = await getMenu(call.request.id)
        } catch (err) {
            console.log("remove error: ", err)
            switch (err.message) {
                case "Not Found":
                    callback({
                        code: grpc.status.NOT_FOUND,
                        details: "Menu not found"
                    });
                    break;
                default:
                    callback({
                        code: grpc.status.INTERNAL,
                        details: "Error occurr when getting menu"
                    });
            }
        }

        // remove menu
        console.log(existingMenuItem)
        try {
            await existingMenuItem.deleteOne()
        } catch (err) {
            console.log("remove error: ", err)
            callback({
                code: grpc.status.INTERNAL,
                details: "Error occurr when deleting menu"
            });
        }

        // success callback
        callback(null, {});
    }
});

async function getMenu(id) {
    let menuItem
    try {
        menuItem = await Menu.findById(id)
    } catch (err) {
        throw new Error("Internal")
    }

    if (menuItem == null) {
        throw new Error("Not Found")
    }

    return menuItem
}

const PORT = process.env.PORT || 30043;
server.bindAsync(`127.0.0.1:${PORT}`, grpc.ServerCredentials.createInsecure(), () => { server.start(); });
console.log(`Server running at http://127.0.0.1:${PORT}`);
