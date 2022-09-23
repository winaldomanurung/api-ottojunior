//Untuk menerjemahkan token yang dikirimkan Frontend ke Backend

const jwt = require("jsonwebtoken");

module.exports = {
  // Next untuk melanjutkan ke middleware di controller
  auth: (req, res, next) => {
    const authHeader = req.headers["auth-token"];
    const token = authHeader && authHeader.split(" ")[1];
    console.log(req.headers);

    if (token == null) return res.status(401).send("User not auth");

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
      if (err) {
        return res.status(401).send("User not auth");
      }

      req.user = decode;
      console.log(decode);
      next(); //untuk mengirimkan req.user ke controller
    });
    // console.log("keluar auth");
  },
};
