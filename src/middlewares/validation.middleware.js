function validateRequest(req, next, schema) {
  const options = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: true, // remove unknown props
  };
  const { error, value } = schema.validate(
    req.method === "GET" ? req.headers : req.body,
    options
  );
  if (error) {
    throw new Error(
      `Validation error: ${error.details.map((x) => x.message).join(", ")}`
    );
  } else {
    if (req.method === "GET") {
      req.headers = value;
    } else {
      req.body = value;
    }
    next();
  }
}
module.exports = validateRequest;
