// higher order middleware to know which schema to take and reuturn the custom middleware tailored to that schema
export const validate = (schema) => (req, res, next) => {
  try {
    // pass the body, query, and params to Zod to check all of them
    const parsedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.body = parsedData.body;
    req.query = parsedData.query;
    req.params = parsedData.params;

    next();
  } catch (err) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      message: "Invalid request data",
      errors: formattedErrors,
    });
  }
};
