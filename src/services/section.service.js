const mongoose = require("mongoose");
const Sections = require("../models/section.model");
const Devices = require("../models/device.model");
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

async function deleteSection(accountId, sectionId) {
  const devices = await Devices.find({ section_id: sectionId });
  if (devices.length > 0) {
    return `Failed to delete section ! ${devices.length} devices exist in this section.`;
  }
  const types = await Sections.deleteOne({
    _id: sectionId,
    account_id: accountId
  });
  if (types.ok === 1 && types.deletedCount > 0) {
    return "Section Deleted";
  }
  return "No sections found for the id !";
}

async function getUserSections({ user }) {
  const sections = await Sections.find({ account_id: user.account.id });
  return sections;
}

async function updateSection({
  user, name, type, sectionId
}) {
  const update = { updatedAt: new Date() };
  if (name) update.name = name;
  if (type && mongoose.isValidObjectId(type)) {
    const typ = await Types.findOne({ _id: type });
    if (typ) update.type = type;
  }
  const updateDb = await Sections.updateOne(
    {
      _id: sectionId,
      account_id: user.id
    },
    update
  );
  return updateDb.nModified > 0;
}

module.exports = {
  createSection,
  getSectionTypes,
  getUserSections,
  deleteSection,
  updateSection
};
