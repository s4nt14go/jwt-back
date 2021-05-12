import { APIGatewayProxyEvent } from 'aws-lambda';
import { get as getToken } from '../../functions/get-token';
import njwt from 'njwt';
import { Chance } from 'chance';

const chance = Chance();

describe('When we create a token', () => {

  const account = chance.name();
  let token;
  const SECRET = chance.string();
  const ISSUER = chance.name();

  beforeAll(async () => {

    process.env.SECRET = SECRET;
    process.env.ISSUER = ISSUER;

    const response: any = await getToken({
      body: JSON.stringify({
        account,
      })} as APIGatewayProxyEvent, null, null);

    token = response.body.replace('"', '');
  })

  it(`is valid and the has correct sub and iss fields`, async () => {
    const data = njwt.verify(token, SECRET);
    expect(data.body).toEqual(
      expect.objectContaining({
        sub: account,
        iss: ISSUER,
      }),
    )
  });

  afterAll(async () => {
    delete process.env.SECRET;
    delete process.env.ISSUER;
  });

});
