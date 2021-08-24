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
  await newSection.save();
}

async function getSectionTypes() {
  const types = await Types.find();
  return types;
}

async function getUserSections({ user }) {
  const sections = await Sections.find({ account_id: user.account.id });
  return sections;
}

module.exports = { createSection, getSectionTypes, getUserSections };
