// Middleware
exports.aliasTop5Cheap = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'rate';
  req.query.fields = 'name,difficulty,rate';
  next();
}