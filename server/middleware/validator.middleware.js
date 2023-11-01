const Validator = (paramSchema) => {
  return async (req, res, next) => {
      try {
        let param = req?.body || null
          if(req.method == "GET"){
           param = req?.query || null
          }
          await paramSchema.validateAsync(param);
      } catch (err) {
          return res.status(400).send({
              status: false,
              message: err.message
          });
      }
      next();
  }
};

export default Validator
