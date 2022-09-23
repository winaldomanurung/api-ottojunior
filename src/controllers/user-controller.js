const uuid = require("uuid");
const database = require("../config").promise();
const bcrypt = require("bcrypt");
const createError = require("../helpers/createError");
const createResponse = require("../helpers/createResponse");
const httpStatus = require("../helpers/httpStatusCode");
const { createToken } = require("../helpers/createToken");

const dotenv = require("dotenv");
dotenv.config();

module.exports.getUserData = async (req, res) => {
  let userId = req.user.id;
  console.log(req.user);
  try {
    const GET_USER_BY_ID = `
          SELECT *
          FROM users 
          WHERE userId = ?; 
      `;
    const [USER] = await database.execute(GET_USER_BY_ID, [userId]);

    // validate
    if (!USER.length) {
      throw new createError(
        httpStatus.Bad_Request,
        "Fetch failed",
        "User ID is not registered!"
      );
    }

    delete USER[0].password;
    delete USER[0].balance;
    delete USER[0].id;

    const response = new createResponse(
      httpStatus.OK,
      "Get user profile success",
      "User profile retrieved successfully",
      USER[0]
    );

    res.status(response.status).send(response);
  } catch (err) {
    console.log("error : ", err);
    const isTrusted = err instanceof createError;
    if (!isTrusted) {
      err = new createError(
        httpStatus.Internal_Server_Error,
        "SQL Script Error",
        err.sqlMessage
      );
      console.log(err);
    }
    res.status(err.status).send(err);
  }
};

module.exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Validasi apakah email dan username unique
    const CHECK_USER = `SELECT id FROM users WHERE username = ? OR email = ?`;
    const [USER_DATA] = await database.execute(CHECK_USER, [username, email]);
    if (USER_DATA.length) {
      throw new createError(
        httpStatus.Bad_Request,
        "Register failed",
        "Username or email already exists!"
      );
    }

    // Create user ID
    const uid = uuid.v4();

    // Password hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store data user yang melakukan registrasi ke dalam database
    const INSERT_USER = `INSERT INTO users (userId, username, email, password) VALUES(${database.escape(
      uid
    )}, ${database.escape(username)}, ${database.escape(
      email
    )}, ${database.escape(hashedPassword)});
        `;

    console.log(INSERT_USER);
    const [INFO] = await database.execute(INSERT_USER);

    const response = new createResponse(
      httpStatus.OK,
      "Register success",
      "User data is successfully registered",
      `Inserted ID: ${INFO.insertId}`
    );

    res.status(response.status).send(response);
  } catch (err) {
    console.log("error : ", err);
    const isTrusted = err instanceof createError;
    if (!isTrusted) {
      err = new createError(
        httpStatus.Internal_Server_Error,
        "SQL Script Error",
        err.sqlMessage
      );
      console.log(err);
    }
    res.status(err.status).send(err);
  }
};

module.exports.login = async (req, res) => {
  const { credential, password } = req.body;
  try {
    // Check apakah username atau email exist di dalam database
    let FIND_USER = `SELECT * FROM users WHERE username=${database.escape(
      credential
    )} OR email=${database.escape(credential)};`;
    const [USER] = await database.execute(FIND_USER);
    if (!USER.length) {
      throw new createError(
        httpStatus.Bad_Request,
        "Log in failed",
        "Username or email is not registered!"
      );
    }

    // Jika user exist, validasi passwordnya
    const isValid = await bcrypt.compare(password, USER[0].password);
    if (!isValid) {
      throw new createError(
        httpStatus.Bad_Request,
        "Log in failed",
        "Invalid password!"
      );
    }

    //bahan token
    let id = USER[0].userId;

    //create token
    let token = createToken({ id });

    delete USER[0].password;
    delete USER[0].balance;
    delete USER[0].id;
    delete USER[0].userId;

    const response = new createResponse(
      httpStatus.OK,
      "Login success",
      "Welcome back!",
      USER[0]
    );

    res
      .header("Auth-Token", `Bearer ${token}`)
      .status(response.status)
      .send(response);
  } catch (err) {
    console.log("error : ", err);
    const isTrusted = err instanceof createError;
    if (!isTrusted) {
      err = new createError(
        httpStatus.Internal_Server_Error,
        "SQL Script Error",
        err.sqlMessage
      );
      console.log(err);
    }
    res.status(err.status).send(err);
  }
};

module.exports.getBalance = async (req, res) => {
  let userId = req.user.id;

  try {
    const GET_BALANCE_BY_ID = `
          SELECT balance
          FROM users 
          WHERE userId = ?; 
      `;
    const [BALANCE] = await database.execute(GET_BALANCE_BY_ID, [userId]);

    const response = new createResponse(
      httpStatus.OK,
      "Get user's balance data success",
      "User's balance data retrieved successfully",
      BALANCE
    );

    res.status(response.status).send(response);
  } catch (err) {
    res.status(err.status).send(err.message);
  }
};
