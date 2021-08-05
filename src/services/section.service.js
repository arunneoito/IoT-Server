const Sections = require("../models/section.model");
const Types = require("../models/sectiontypes.model");

async function createSection({ user, name, typeId }) {
  const sectionExist = await Sections.findOne({
    account_id: user.account.id,
    name
  });
  if (sectionExist) throw new Error("Section Already Exist!");
  const newSection = new Sections({
    name,
    typeId,
    account_id: user.account.id,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const saved = await newSection.save();
  console.log(saved);
}

async function getSectionTypes() {
  const types = await Types.find();
  return types;
}
module.exports = { createSection, getSectionTypes };
