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
exports.getEmailer = void 0;
const infrastructure_1 = require("@pokket-finance/infrastructure");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function getEmailer() {
    var _a, _b, _c, _d, _e, _f;
    let creator;
    let emailSender;
    let emailTos;
    let emailCcs;
    creator = new infrastructure_1.emailerCreator();
    if (process.env.USE_EMAILSERVICE) {
        const emailerConfig = {
            useKafka: true,
            clientId: process.env.KAFKA_CLIENT_ID,
            brokers: (_b = (_a = process.env.KAFKA_BROKERS) === null || _a === void 0 ? void 0 : _a.split(",")) !== null && _b !== void 0 ? _b : []
        };
        emailSender = await creator.createEmailer(infrastructure_1.emailerType.emailService, emailerConfig);
        if (!emailerConfig.clientId) {
            console.error("KAFKA_CLIENT_ID not specified");
        }
        if (emailerConfig.brokers.length == 0) {
            console.error("KAFKA_BROKERS not specified");
        }
    }
    else {
        emailSender = await creator.createEmailer(infrastructure_1.emailerType.nodemailer, {});
    }
    emailTos = (_d = (_c = process.env.EMAIL_TO) === null || _c === void 0 ? void 0 : _c.split(";")) !== null && _d !== void 0 ? _d : [];
    if (emailTos.length == 0) {
        console.error("EMAIL_TO not specified");
    }
    emailCcs = (_f = (_e = process.env.EMAIL_CC) === null || _e === void 0 ? void 0 : _e.split(";")) !== null && _f !== void 0 ? _f : [];
    return {
        emailSender,
        emailTos,
        emailCcs
    };
}
exports.getEmailer = getEmailer;
