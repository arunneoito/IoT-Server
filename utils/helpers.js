/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable camelcase */

exports.getDeviceTopic = ({ id, account_id, section_id }) =>
  `${account_id}/${section_id}/${id}`;
