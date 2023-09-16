const PROTO_PATH="../restaurant.proto";

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

require('dotenv').config({ path: './config.env' });

var packageDefinition = protoLoader.loadSync(PROTO_PATH,{
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});

var restaurantService =grpc.loadPackageDefinition(packageDefinition).RestaurantService;

const client = new restaurantService(process.env.SERVER_HOST, grpc.credentials.createInsecure());

module.exports = client;