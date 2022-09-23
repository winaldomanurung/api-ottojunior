const database = require("../config").promise();
const axios = require("axios");
const createError = require("../helpers/createError");
const createResponse = require("../helpers/createResponse");
const httpStatus = require("../helpers/httpStatusCode");
const databaseSync = require("../config");

module.exports.getData = async (req, res) => {
  axios
    .get("https://phoenix-imkas.ottodigital.id/interview/biller/v1/list")
    .then(function (result) {
      const response = new createResponse(
        httpStatus.OK,
        "Get biller transaction data success",
        "Biller transaction data retrieved successfully",
        result.data
      );
      res.status(response.status).send(result.data);
    })
    .catch(function (error) {
      res.status(401).send(error);
    });
};

module.exports.confirmTransaction = async (req, res) => {
  let userId = req.user.id;
  const transactionId = req.params.billerId;
  let transactionData = {};
  axios
    .get(
      `https://phoenix-imkas.ottodigital.id/interview/biller/v1/detail?billerId=${transactionId}`
    )
    .then(function (result) {
      transactionData = result.data.data;
      return transactionData;
    })
    .then(function (transactionData) {
      const { id, category, product, description, price, fee } =
        transactionData;

      const BALANCE_CHECK = `SELECT balance
      FROM users 
      WHERE userId = ${database.escape(userId)};`;

      let INSERT_DATA = `INSERT INTO transactions (transactionId, userId, category, product, description, price, fee) VALUES(${database.escape(
        id
      )}, ${database.escape(userId)}, ${database.escape(
        category
      )}, ${database.escape(product)}, ${database.escape(
        description
      )}, ${database.escape(price)}, ${database.escape(fee)});
          `;

      const UPDATE_BALANCE = `UPDATE users SET balance=balance-${database.escape(
        price
      )}-${database.escape(fee)} WHERE userId = ${database.escape(userId)};`;

      console.log(INSERT_DATA);
      console.log(UPDATE_BALANCE);

      databaseSync.query(BALANCE_CHECK, (err, results) => {
        if (err || results[0].balance < price + fee) {
          err = new createError(
            httpStatus.Bad_Request,
            "Payment failed. ",
            "Please topup your balance."
          );

          res.status(err.status).send(err);
          return;
        } else {
          databaseSync.query(INSERT_DATA, (err, results) => {
            if (err) {
              err = new createError(
                httpStatus.Bad_Request,
                "Payment failed. ",
                "Please check your query."
              );

              res.status(err.status).send(err);
              return;
            } else {
              databaseSync.query(UPDATE_BALANCE, (err, results) => {
                if (err) {
                  err = new createError(
                    httpStatus.Bad_Request,
                    "Payment failed. ",
                    "Please check your balance."
                  );

                  res.status(err.status).send(err);
                  return;
                }

                const response = new createResponse(
                  httpStatus.OK,
                  "Payment success",
                  `Your total Rp ${
                    price + fee
                  } payment for ${description} success!`,
                  ""
                );

                res.status(response.status).send(response);
              });
            }
          });
        }
      });
    })
    .catch(function (error) {
      let err = new createError(
        httpStatus.Internal_Server_Error,
        "SQL Script Error",
        err.sqlMessage
      );

      res.status(err.status).send(err);
    });
};

module.exports.getTransactionHistory = async (req, res) => {
  let userId = req.user.id;

  console.log(userId);
  try {
    const GET_TRANSACTIONS_BY_ID = `
          SELECT *
          FROM transactions 
          WHERE userId = ?; 
      `;
    const [TRANSACTIONS] = await database.execute(GET_TRANSACTIONS_BY_ID, [
      userId,
    ]);

    // validate
    if (!TRANSACTIONS.length) {
      throw new createError(
        httpStatus.Bad_Request,
        "Fetch failed",
        "There isn't any transaction history!"
      );
    }

    const response = new createResponse(
      httpStatus.OK,
      "Get transaction history success",
      "Transaction history retrieved successfully",
      TRANSACTIONS
    );

    res.status(response.status).send(response);
  } catch (err) {
    res.status(err.status).send(err.message);
  }
};

module.exports.topUp = async (req, res) => {
  let userId = req.user.id;
  const amount = req.body.amount;

  try {
    // Check apakah body memiliki content
    const isEmpty = !Object.keys(req.body).length;
    if (isEmpty) {
      throw new createError(
        httpStatus.Bad_Request,
        "Update balance failed",
        "Your topup process is incomplete!"
      );
    }

    //  Buat query untuk update
    const UPDATE_BALANCE = `UPDATE users SET balance=balance+${database.escape(
      amount
    )} WHERE userId = ${database.escape(userId)};`;
    const [UPDATED_BALANCE] = await database.execute(UPDATE_BALANCE);

    const response = new createResponse(
      httpStatus.OK,
      "Update balance success",
      "Balance update saved successfully!",
      UPDATED_BALANCE,
      ""
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
