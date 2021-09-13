/* eslint-disable no-use-before-define */

const express = require("express");

const router = express.Router();
const Joi = require("joi");
const mongoose = require("mongoose");

const authorize = require("../middlewares/auth.middleware");
const SectionService = require("../services/section.service");
const validateRequest = require("../middlewares/validation.middleware");

router.get("/getSectionTypes", authorize(), getSectionsTypes);
router.get("/getUserSection", authorize(), getUserSections);

router.post("/create", authorize(), sectionSchema, createSection);

router.put("/update/:section_id", authorize(), updateSection);

router.delete("/delete/:section_id", authorize(), deleteSection);

function sectionSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
    typeId: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function createSection(req, res, next) {
  SectionService.createSection({ user: req.user, ...req.body })
    .then(() => {
      res.status(200).send({ message: "Created Succesfully", error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function updateSection(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.section_id)) { throw new Error("Invalid section id !"); }
  const { name, type } = req.body;
  if (!name && !type) {
    throw new Error("Invalid Request ! update parameters missing");
  }
  SectionService.updateSection({
    user: req.user,
    name,
    type,
    sectionId: req.params.section_id
  })
    .then((d) => {
      res
        .status(d ? 200 : 404)
        .send({
          message: d ? "Section Updated" : "Section Not Found !",
          error: false
        });
    })
    .catch((e) => {
      next(e);
    });
}

function getUserSections(req, res, next) {
  SectionService.getUserSections({ user: req.user })
    .then((data) => {
      res.status(200).send({ data, message: "Success", error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function deleteSection(req, res, next) {
  if (!req.params.section_id) {
    throw new Error("Invalid Request ! need section id");
  }
  SectionService.deleteSection(req.user.id, req.params.section_id)
    .then((data) => {
      res.status(200).send({ data, message: "Success", error: false });
    })
    .catch((e) => {
      next(e);
    });
}

function getSectionsTypes(req, res, next) {
  SectionService.getSectionTypes()
    .then((data) => {
      res.status(200).send({ message: data, error: false });
    })
    .catch((e) => {
      next(e);
    });
}

module.exports = router;
