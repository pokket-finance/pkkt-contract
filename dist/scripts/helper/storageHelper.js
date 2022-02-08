"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileStorage = exports.getStorage = void 0;
const infrastructure_1 = require("@pokket-finance/infrastructure");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function getStorage() {
    let creator;
    creator = new infrastructure_1.storageCreator();
    var secureStorage;
    if (process.env.USE_ENVVARSTORAGE) {
        secureStorage = creator.createStorage(infrastructure_1.storageType.environmentVariable, {});
    }
    else {
        secureStorage = creator.createStorage(infrastructure_1.storageType.awsSSM, {
            region: process.env.AWS_REGION,
            tableName: process.env.AWS_TABLENAME,
            encryted: true
        });
    }
    return secureStorage;
}
exports.getStorage = getStorage;
function getFileStorage() {
    let creator;
    creator = new infrastructure_1.storageCreator();
    var secureStorage;
    secureStorage = creator.createStorage(infrastructure_1.storageType.disk, {
        fileName: process.env.CONFIG_FILE,
    });
    return secureStorage;
}
exports.getFileStorage = getFileStorage;
