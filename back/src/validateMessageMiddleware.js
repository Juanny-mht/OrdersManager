const Joi = require('@hapi/joi');
const { fromJson, toJson } = require('json-joi-converter');
const jsonSchemasInput = require('./OrdersManager.json');
const jsonSchemasOutput = require('./OrdersManagerResponse.json');

// Convertir le schéma de validation JSON en schéma de validation Joi
const joiSchemasInput = {};
for (const [typeName, schema] of Object.entries(jsonSchemasInput)) {
    joiSchemasInput[typeName] = fromJson(schema);
}
const joiSchemasOutput = {};
for (const [typeName, schema] of Object.entries(jsonSchemasOutput)) {
    joiSchemasOutput[typeName] = fromJson(schema);
}

// Fusionner les schémas d'entrée et de sortie
const joiSchemas = { ...joiSchemasInput, ...joiSchemasOutput };

// Fonction de validation pour vérifier si les body de la requête sont valides
const validateMessage = (type, body, next) => {
    // Récupérer le schéma de validation correspondant au type de message
    const schema = joiSchemas[type];
    if (!schema) {
        console.error('Schema not found for type:', type);
        return;
    }

    // Validation du message
    const { error } = schema.validate(body);
    if (error) {
        console.error('Validation error:', error.message);
        throw new Error(error.message);
        return;
    }

    // Appel de la fonction next sans erreur de validation
    next();
}

module.exports = validateMessage;