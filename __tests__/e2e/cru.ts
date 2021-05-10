import axios from 'axios';
import { Chance } from 'chance';
import { load } from 'ts-dotenv';
import njwt from 'njwt';
import retry from 'async-retry';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
const DocumentClient = new DynamoDB.DocumentClient();

const chance = Chance();

const env = load({
  API_URL: String,
  SECRET: String,
  ISSUER: String,
  TABLE: String,
});

const API = env.API_URL;
const { SECRET, ISSUER, TABLE } = env;

describe('When we created an account and get a token', () => {

  const account = chance.name();
  let token;

  beforeAll(async () => {

    await axios({
      method: 'post',
      url: `${API}/create-account`,
      data: JSON.stringify({
        account,
      }),
    });

    const { data } = await axios({
      method: 'post',
      url: `${API}/get-token`,
      data: JSON.stringify({
        account,
      })
    });

    token = data;
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

  it(`updates account and read back updated values`, async () => {

    const country = chance.country({ full: true });

    await axios( {
      method: 'post',
      url: `${API}/update-account`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: JSON.stringify({
        country,
      }),
    });

    let retryNumber = 0;
    await retry(async () => {
      const read = await axios({
        method: 'get',
        url: `${API}/read-account`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      expect(read.data).toEqual(expect.objectContaining({
        country,
      }));
      retryNumber++;
      console.log(`updates retryNumber: ${retryNumber}`);
    }, {
      retries: 2,
      maxTimeout: 1000
    })
  });

  it(`returns 401 when trying to read account without token`, async () => {
    try {
      await axios({
        method: 'get',
        url: `${API}/read-account`,
      });
      throw new Error(`Throw error in case previous get doesn't error, so we force expect is always assessed in catch block`);
    } catch (e) {
      expect(e.response.status).toEqual(401)
    }
  });

  it(`returns 401 when trying to update account without token`, async () => {
    try {
      const country = chance.country({ full: true });

      await axios( {
        method: 'post',
        url: `${API}/update-account`,
        data: JSON.stringify({
          country,
        }),
      });
      throw new Error(`Throw error in case previous post doesn't error, so we force expect is always assessed in catch block`);
    } catch (e) {
      expect(e.response.status).toEqual(401)
    }
  });

  afterAll(async () => {
    await DocumentClient.delete({
      TableName: TABLE,
      Key: {
        account,
      },
    }).promise();
  })

});
