const mongoose = require("../../db").mongoose;

// const schema = new mongoose.Schema(
//   {
//     roles: [
//       {
//         function: String,
//         role: [mongoose.SchemaTypes.String],
//       },
//     ],
//   },
//   { versionKey: false }
// );

const schema = new mongoose.Schema(
  {
    functions: [
      {
        name: String,
        roles: [{
          name: String,
          meanSalary: [{
            region: String,
            currency: String,
            value: String
          }]
        }],
        primarySkills: [mongoose.SchemaTypes.String]
      },
    ],
  },
  { versionKey: false }
);

const Roles = mongoose.model("roles", schema);

module.exports = Roles;
