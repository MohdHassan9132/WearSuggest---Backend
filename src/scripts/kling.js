import "dotenv/config";
import jwt from "jsonwebtoken";

export function generateKlingToken() {
  const ak = process.env.KLING_ACCESS_KEY; // fill access key
  const sk = process.env.KLING_SECRET_KEY; // fill secret key
  const payload = {
    iss: ak,
    exp: Math.floor(Date.now() / 1000) + 1800, // current time + 30 min
    nbf: Math.floor(Date.now() / 1000) - 5,    // current time - 5 sec
  };

  const token = jwt.sign(payload, sk, {
    algorithm: "HS256",
    header: {
      typ: "JWT",
    },
  });

  return token;
}

const authorization = generateKlingToken();

// console.log(authorization);

