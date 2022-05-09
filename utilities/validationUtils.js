
/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
let isStringProvided = (param) => 
    param !== undefined && param.length > 0

/**
 * Checks the parameter to see if it is a valid password.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a valid password
 */
let isValidPassword = (param) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(param)

 /**
 * Checks the parameter to see if it is a valid email.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a valid email
 */
  let isValidEmail = (param) =>
    /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(param)


module.exports = { 
  isStringProvided, isValidPassword, isValidEmail
}