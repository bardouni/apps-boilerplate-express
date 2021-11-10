import type {Request, Response} from 'express';
import jsonwebtoken from 'jsonwebtoken';
import rp from 'request-promise';
import knex from '../services/db';

export function lightfunnelsConnect(req: Request, res: Response, next){
	const state = 123;
	res.status(200).end(
		`${process.env.LightfunnelsFrontUrl}admin/oauth?client_id=${process.env.LightfunnelsAppKey}`+
			`&state=${state}&redirect_uri=${req.body.redirectUri}&response_type=code&scope=orders,funnels&account-id=${req.body.accountID}`
	);
}

export async function lightfunnelsCallback(req: Request, res: Response, next){

	const eventBody = req.body;

	await (
		rp({
			uri: `${process.env.LightfunnelsUrl}oauth/access`,
			method: 'POST',
			body:{
				client_id: process.env.LightfunnelsAppKey,
				client_secret: process.env.LightfunnelsAppSecret,
				code: eventBody.code,
			},
			json: true,
			simple: false
		})
		.then(
			async function(data: {access_token: string, account_id: number, id: number}){

				if(data === undefined){
					return res.send(401).end("wrong code");
				}

				// we store lightfunnels token with its id
				let [id] = await (
					knex.table('accounts').insert({
						lightfunnels_token: data.access_token,
						lightfunnels_account_id: data.account_id
					})
					.onConflict()
					.merge({
						'lightfunnels_token': knex.raw('values(lightfunnels_token)'),
						'id': knex.raw('LAST_INSERT_ID(id)')
					})
				);

				// we generate a new token for this app only so we don't share the lightfunnel's one.
				const acData: TokenData = {acid: id};
				let token = jsonwebtoken.sign(acData, process.env.AppSecret);
				
				res.status(200).json({token, id: data.id});

			}
		)
	);

}

export type TokenData = {
	acid: number
}