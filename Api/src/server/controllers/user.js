import User from '../models/user';

/**
 * Get logged in user details
 * @param req
 * @param res
 */
const me = (req, res) => {
    const emailId = req.params.emailId;
    User.findOne({ emailId }, (err, user) => {
        if (err) res.status(401).json(err);
        if (!user) return res.status(404).send("Not found");
        res.json(user);
    })
};

/**
 * Add user
 * @param req
 * @param res
 */
const addUser = (req, res) => {
  User.create(req.body, (err, user) => {
      if (err) res.status(401).json(err);
      return res.status(201).json(user);
  });
};



module.exports = {
  me,
  addUser
};