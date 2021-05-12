import {Context, APIGatewayEvent, APIGatewayProxyHandler} from "aws-lambda";
import njwt from 'njwt';
import { wrapper } from './lib';
import { SSM } from 'aws-sdk';

const ssm = new SSM()

export const get: APIGatewayProxyHandler = wrapper(async (event: APIGatewayEvent, _context: Context) => {
  console.log('event:', JSON.stringify(event, null, 2));

  const Names = [
    `/jwt/${event.requestContext.stage}/SECRET`,
    `/jwt/${event.requestContext.stage}/ISSUER`,
  ]
  const request = await ssm.getParameters({ Names }).promise();
  const SECRET = request.Parameters.filter(p => p.Name === Names[0])[0].Value;
  const ISSUER = request.Parameters.filter(p => p.Name === Names[1])[0].Value;

  const body = JSON.parse(event.body);

  const claims = { iss: ISSUER, sub: body.account }
  const jwt = njwt.create(claims, SECRET)
  jwt.setExpiration(new Date().getTime() + 5*60*1000)
  const token = jwt.compact();
  console.log(token);

  return token;
});
