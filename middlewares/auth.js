const sendResponse = require("../helpers/response_handler").sendResponse;
const verifyJWT = require("../helpers/jwt").verifyJWT;
const _get = require("lodash").get;
function handleToken(req, res, next) {
  // if (req.url.startsWith('/email-verify?')) {
  //   console.log(req.url)
  //   const authHeader = _get(req.headers, 'authorization') || "";
  //   console.log("authHeader", authHeader)
  //   const responseObj = {};
  //   if (authHeader) {
  //     console.log('in If authHeader')
  //     const token = authHeader.split(' ')[1]
  //     try {
  //       const data = verifyJWT(token)
  //       if (!data) {
  //         responseObj.err = true
  //         responseObj.responseCode = 401
  //         responseObj.msg = 'Authorization token is invalid'
  //         return sendResponse(responseObj, res)
  //       } else {
  //         req.tokenUser = data
  //         req.headers['userid'] = data.data.id
  //         req.headers['email'] = data.data.email
  //         next()
  //       }
  //     } catch (ex) {
  //       responseObj.err = true
  //       responseObj.responseCode = 401
  //       responseObj.msg = ex.error.message || 'Authorization token verfication failed'
  //       return sendResponse(responseObj, res)
  //     }
  //   }
  //   else {
  //     console.log('in else authHeader')
  //     next()
  //   }
  // }
  // else {
  const authHeader = _get(req.headers, "authorization");
  const responseObj = {};
  responseObj.err = true;
  responseObj.responseCode = 401;
  if (!authHeader) {
    responseObj.msg = "Authorization header is missing";
    return sendResponse(responseObj, res);
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    responseObj.msg = "Authorization token is missing";
    return sendResponse(responseObj, res);
  } else {
    try {
      const data = verifyJWT(token);
      if (!data) {
        responseObj.msg = "Authorization token is invalid";
        return sendResponse(responseObj, res);
      } else {
        req.tokenUser = data;
        req.headers["userid"] = data.data.id;
        req.headers["email"] = data.data.email;
        next();
      }
    } catch (ex) {
      responseObj.msg =
        ex.error.message || "Authorization token verfication failed";
      return sendResponse(responseObj, res);
    }
  }
}

// }

module.exports = {
  handleToken: handleToken,
};
