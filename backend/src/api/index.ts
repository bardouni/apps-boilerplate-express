import schema from './schema';
import * as graphql from 'graphql';
import type {Context, APIGatewayProxyEventV2, APIGatewayProxyResultV2} from 'aws-lambda';
import setupLoaders from './loaders';
import knex from '../services/db';
import {SimpleError, reduceError} from './errors';
import translation from '../services/translation';
import type {Request, Response} from 'express';

export async function api(req: Request & {accountID: number}, res: Response, next) {

	let {variables, query, operationName} = req.body;

	const accountID = req.accountID;

	let row = await knex.table('accounts')
		// here we use the app's ids, because it how we generated the token
		// check lightfunnels function
		.where('accounts.id', accountID)
		.first();

	if(!row){

		// here we should throw an error
		// this can happen if the user installed the app then uninstalled it and 
		// tried to open it,
		// we still has a valid token in the browser store, but the row was removed from the database
		res.status(200).json({
			data: null,
			errors:[
				{
					key: 'account_deleted' as keyof typeof translation,
					message: translation.account_deleted,
					path: []
				}
			]
		});
		
	} else {

		const {lightfunnels_token: lightfunnelsToken} = row;

		const context: ApiContext = {
			account:{
				id: accountID,
				lightfunnelsToken,
			},
			loaders: setupLoaders(accountID, lightfunnelsToken)
		};

		await graphql.graphql(
			schema,
			query,
			{},
			context,
			variables,
			operationName,
		)
		.then(
			function (resp: any) {
				if(resp.errors){
					resp.errors = resp.errors.reduce(reduceError, []);
				}
				res.status(200).json(resp);
			}
		);

	}

}