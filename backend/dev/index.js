#!/usr/bin/env node

const http = require('http');
const express = require('express');
const cors = require('cors');
const {app} = require('../bundle/src/aws');
const fs = require('fs');

const {default: schema} = require('../bundle/src/api/schema/index');
const graphql = require('graphql');
const schemaPath = __dirname + '/../../front/src/schema.graphql';
const schemaString = graphql.printSchema(schema);
let oldSchemaString;
try {
  oldSchemaString = fs.readFileSync(schemaPath);
} catch (e) {}

if(schemaString !== oldSchemaString){
  fs.writeFileSync(
    schemaPath,
    schemaString
  );
  console.log('schema updated!');
}

const port = 9001;

app.set('port', port);
app.use(express.urlencoded({ extended: false }))

app.use('/graphiql', require('./gq/index').handler);

const server = http.createServer(app);

server.listen(port);
server.on('error', console.log);
server.on('listening', function () {
  console.log('listening on :', this.address().port);
});
