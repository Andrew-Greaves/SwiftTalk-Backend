const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Note: In a real-world scenario, passwords should be hashed.
  contacts: [{ type: Schema.Types.ObjectId, ref: "users" }],
});

const UserModel = mongoose.model("users", userSchema);
module.exports = UserModel
