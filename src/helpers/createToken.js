//Untuk menggenerate token yang dikirimkan dari Backend ke Frontend

const jwt = require("jsonwebtoken");

module.exports = {
  createToken: (payload) => {
    let token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "12h",
    });
    return token;
  },
};
