const httpStatus = require("./httpStatusCode");

class NewError {
  constructor(
    httpStatusCode = httpStatus.OK,
    subject = "Operation success",
    message = "OK",
    dataUser = {}
  ) {
    (this.status = httpStatusCode),
      (this.subject = subject),
      (this.message = message),
      (this.dataUser = dataUser);
  }
}

module.exports = NewError;
