import {Context, APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import njwt from 'njwt';
import { wrapper } from './lib';

export const get: APIGatewayProxyHandler = wrapper(async (event: APIGatewayEvent, _context: Context) => {
  console.log('event:', JSON.stringify(event, null, 2));

  const body = JSON.parse(event.body);

  const { SECRET, ISSUER } = process.env;
  const claims = { iss: ISSUER, sub: body.account }
  const jwt = njwt.create(claims, SECRET)
  jwt.setExpiration(new Date().getTime() + 5*60*1000)
  const token = jwt.compact();
  console.log(token);

  return token;
});
