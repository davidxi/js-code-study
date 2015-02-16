/**
 * @providesModule isScalar
 */
function isScalar(h) {
    return (/string|number|boolean/).test(typeof h);
}
module.exports = isScalar;