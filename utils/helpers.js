/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable camelcase */

exports.getDeviceTopic = ({ id, account_id, section_id }) =>
  `${account_id}/${section_id}/${id}`;

exports.validateValue = (value, valueType) => {
  if (
    (valueType === "boolean" && typeof value !== "boolean") ||
    (valueType === "string" && typeof value !== "string") ||
    (valueType === "number" && typeof value !== "number")
  ) {
    return false;
  }
  return true;
};
